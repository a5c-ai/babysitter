# Code Sample Validation Skill

Extract, validate, and test code samples in documentation.

## Overview

This skill provides comprehensive validation for code samples embedded in documentation. It extracts code blocks from Markdown, validates syntax, executes samples, checks outputs, and ensures code formatting consistency.

## When to Use

- Validating code examples in documentation
- Testing code samples execute correctly
- Checking for outdated API usage
- Generating test files from documentation
- Enforcing code formatting standards

## Quick Start

### Validate Documentation

```json
{
  "inputPath": "./docs",
  "action": "validate",
  "languages": ["javascript", "python"]
}
```

### Extract Runnable Code

```json
{
  "inputPath": "./docs",
  "action": "extract",
  "outputDir": "./tests/samples"
}
```

### Generate Tests

```json
{
  "inputPath": "./docs",
  "action": "generate-tests",
  "outputDir": "./tests/docs"
}
```

## Key Features

### 1. Code Extraction
- Parse Markdown code blocks
- Support directives (skip, runnable)
- Extract metadata (title, filename)

### 2. Syntax Validation
- Multi-language support
- Parser configuration
- Error reporting

### 3. Execution Testing
- Sandbox execution
- Output verification
- Timeout handling

### 4. Format Checking
- Prettier (JS/TS)
- Black (Python)
- gofmt (Go)

## Supported Languages

| Language | Syntax | Execute | Format |
|----------|--------|---------|--------|
| JavaScript | Yes | Yes | Prettier |
| TypeScript | Yes | Yes | Prettier |
| Python | Yes | Yes | Black |
| Go | Yes | Yes | gofmt |
| Bash | Yes | Yes | - |
| JSON | Yes | No | Prettier |
| YAML | Yes | No | - |

## Code Block Directives

````markdown
```javascript runnable
// Will be executed
```

```python skip-validation
# Will be skipped
```

```typescript expect-error
// Expected to fail
```
````

## Validation Report

```json
{
  "summary": {
    "total": 45,
    "passed": 42,
    "failed": 2,
    "skipped": 1
  },
  "issues": [
    {
      "file": "docs/api.md",
      "line": 78,
      "issue": "Syntax error",
      "suggestion": "Missing closing bracket"
    }
  ]
}
```

## CLI Commands

```bash
# Validate samples
node scripts/validate-docs.js --input docs/

# Extract samples
node scripts/validate-docs.js --action extract --output tests/

# Check formatting
node scripts/validate-docs.js --action format-check
```

## CI/CD Integration

```yaml
- name: Validate code samples
  run: node scripts/validate-docs.js --input docs/
```

## Process Integration

| Process | Usage |
|---------|-------|
| `docs-testing.js` | Validate in CI |
| `api-reference-docs.js` | API examples |
| `sdk-doc-generation.js` | SDK samples |
| `interactive-tutorials.js` | Tutorial code |

## Dependencies

- @babel/parser
- prettier
- typescript
- black (Python)

## References

- [Prettier](https://prettier.io/)
- [Black](https://black.readthedocs.io/)
- [Jest](https://jestjs.io/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-008
**Category:** Quality Assurance
**Status:** Active
