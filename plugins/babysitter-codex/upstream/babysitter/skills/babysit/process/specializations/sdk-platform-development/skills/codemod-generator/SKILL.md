---
name: codemod-generator
description: Generate automated code migration scripts (codemods)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Codemod Generator Skill

## Overview

This skill generates automated code migration scripts (codemods) that transform consumer code to use new API versions, reducing the burden of SDK upgrades on developers.

## Capabilities

- Create AST-based code transformations
- Support multiple languages (JavaScript, TypeScript, Python, Go)
- Provide dry-run mode with change preview
- Implement safe rollback mechanisms
- Generate detailed migration reports
- Handle edge cases and partial migrations
- Support interactive migration modes
- Validate transformations with tests

## Target Processes

- Backward Compatibility Management
- Package Distribution
- SDK Versioning and Release Management

## Integration Points

- jscodeshift for JavaScript/TypeScript
- libcst for Python
- go-codemod for Go
- Rector for PHP
- Custom AST transformers

## Input Requirements

- Source and target API versions
- Transformation rules specification
- Test cases for validation
- Edge case handling requirements
- Rollback strategy

## Output Artifacts

- Codemod scripts per language
- Dry-run reports
- Migration validation tests
- Edge case documentation
- CLI wrapper for execution
- Rollback scripts

## Usage Example

```yaml
skill:
  name: codemod-generator
  context:
    sourceVersion: "1.x"
    targetVersion: "2.0"
    languages:
      - typescript
      - python
    transformations:
      - type: methodRename
        from: oldMethod
        to: newMethod
      - type: parameterChange
        method: createResource
        changes:
          - name: config
            wrap: options
    dryRun: true
    generateTests: true
```

## Best Practices

1. Always provide dry-run mode first
2. Generate comprehensive change reports
3. Handle partial migrations gracefully
4. Include rollback capabilities
5. Test codemods against real codebases
6. Document manual intervention cases
