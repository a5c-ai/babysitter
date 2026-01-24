---
name: error-code-catalog
description: Manage and document SDK error codes and messages
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Error Code Catalog Skill

## Overview

This skill manages a comprehensive catalog of SDK error codes, messages, and documentation, ensuring consistent, helpful error handling across all SDK operations.

## Capabilities

- Define error code taxonomy with categories
- Generate error documentation automatically
- Validate error message quality and actionability
- Support error localization (i18n)
- Map HTTP status codes to SDK errors
- Generate error handling code from catalog
- Track error frequency and patterns
- Create troubleshooting guides per error

## Target Processes

- Error Handling and Debugging Support
- API Design Specification
- API Documentation System

## Integration Points

- Error tracking systems (Sentry, Bugsnag)
- i18n frameworks for localization
- Documentation generators
- SDK code generation
- Analytics platforms

## Input Requirements

- Error categorization requirements
- Message style guidelines
- Localization requirements
- HTTP mapping rules
- Troubleshooting depth

## Output Artifacts

- Error code catalog (JSON/YAML)
- Error documentation pages
- SDK error classes/types
- Localization resource files
- Troubleshooting guides
- Error mapping tables

## Usage Example

```yaml
skill:
  name: error-code-catalog
  context:
    catalogFile: ./errors/catalog.yaml
    errorFormat:
      codePrefix: "SDK"
      codeLength: 4
      pattern: "SDK-{category}-{number}"
    categories:
      - auth
      - validation
      - network
      - rate-limit
      - server
    localization:
      enabled: true
      locales: ["en", "es", "ja", "de"]
    includeRemediation: true
```

## Best Practices

1. Use meaningful error code prefixes
2. Include remediation steps in all errors
3. Categorize errors logically
4. Keep error messages actionable
5. Support localization from the start
6. Link errors to documentation
