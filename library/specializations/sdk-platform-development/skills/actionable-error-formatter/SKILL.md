---
name: actionable-error-formatter
description: Format errors with actionable fix suggestions and documentation links
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Actionable Error Formatter Skill

## Overview

This skill formats SDK errors to include actionable fix suggestions, documentation links, and contextual help that enables developers to resolve issues quickly.

## Capabilities

- Generate helpful, contextual error messages
- Include fix suggestions based on error context
- Add documentation links to relevant pages
- Support verbose debug mode with details
- Format stack traces for readability
- Include request correlation IDs
- Suggest related troubleshooting guides
- Support structured error output (JSON)

## Target Processes

- Error Handling and Debugging Support
- Developer Experience Optimization
- Logging and Diagnostics

## Integration Points

- Error handling frameworks
- Logging systems
- Documentation platforms
- Debug tooling
- IDE integrations

## Input Requirements

- Error catalog reference
- Documentation URL patterns
- Context extraction rules
- Verbosity level definitions
- Stack trace formatting preferences

## Output Artifacts

- Error formatting library
- Message templates
- Documentation link generators
- Debug mode implementation
- Stack trace formatter
- Structured error schemas

## Usage Example

```yaml
skill:
  name: actionable-error-formatter
  context:
    errorCatalog: ./errors/catalog.yaml
    docsBaseUrl: "https://docs.example.com/errors"
    formatting:
      includeStackTrace: development
      includeRequestId: true
      includeSuggestions: true
      maxSuggestions: 3
    verbosityLevels:
      - minimal
      - standard
      - verbose
      - debug
```

## Best Practices

1. Make fix suggestions specific and actionable
2. Link to relevant documentation sections
3. Include request IDs for support queries
4. Provide different verbosity levels
5. Format stack traces for readability
6. Avoid exposing sensitive information
