# OpenAPI/Swagger Skill

Expert skill for OpenAPI/Swagger specification analysis and documentation generation.

## Overview

This skill provides deep expertise in OpenAPI (formerly Swagger) specifications. It supports parsing, validation, linting, documentation generation, breaking change detection, and code sample generation for REST APIs.

## When to Use

- Validating OpenAPI/Swagger specifications
- Generating API reference documentation
- Detecting breaking changes between API versions
- Creating SDK code samples
- Migrating between OpenAPI versions
- Enforcing API design standards

## Quick Start

### Validate a Specification

```json
{
  "specPath": "./api/openapi.yaml",
  "action": "validate"
}
```

### Lint with Custom Rules

```json
{
  "specPath": "./api/openapi.yaml",
  "action": "lint",
  "rulesets": [".spectral.yaml"]
}
```

### Generate Documentation

```json
{
  "specPath": "./api/openapi.yaml",
  "action": "generate-docs",
  "outputDir": "docs/api"
}
```

### Detect Breaking Changes

```json
{
  "specPath": "./api/openapi-v2.yaml",
  "action": "diff",
  "baseSpec": "./api/openapi-v1.yaml"
}
```

## Supported Formats

| Format | Versions |
|--------|----------|
| OpenAPI | 3.0.x, 3.1.x |
| Swagger | 2.0 |
| Formats | YAML, JSON |

## Key Features

### 1. Validation
- Schema compliance checking
- Reference resolution
- Example validation against schemas

### 2. Linting
- Spectral rule integration
- Custom ruleset support
- Best practice enforcement

### 3. Documentation Generation
- ReDoc static HTML
- Swagger UI interactive docs
- Markdown output

### 4. Breaking Change Detection
- Removed endpoints
- Changed types
- Required field changes
- Response changes

### 5. Code Sample Generation
- JavaScript/TypeScript
- Python
- cURL
- Go, Java, Ruby, and more

## CLI Commands

```bash
# Validate specification
npx @redocly/cli lint openapi.yaml

# Generate documentation
npx @redocly/cli build-docs openapi.yaml -o docs/index.html

# Spectral linting
npx spectral lint openapi.yaml --ruleset .spectral.yaml

# Detect breaking changes
oasdiff breaking old.yaml new.yaml
```

## Spectral Configuration

Create `.spectral.yaml`:

```yaml
extends:
  - spectral:oas

rules:
  operation-description: warn
  operation-operationId: error
  operation-security-defined: error
```

## Output Examples

### Validation Result

```json
{
  "valid": true,
  "errors": [],
  "warnings": 2,
  "info": {
    "title": "My API",
    "version": "1.0.0"
  }
}
```

### Breaking Changes

```json
{
  "breaking": [
    {
      "type": "removed-endpoint",
      "path": "DELETE /users/{id}"
    }
  ],
  "nonBreaking": [
    {
      "type": "added-endpoint",
      "path": "GET /users/{id}/profile"
    }
  ]
}
```

## Process Integration

| Process | Usage |
|---------|-------|
| `api-doc-generation.js` | Generate API docs from specs |
| `api-reference-docs.js` | Create reference documentation |
| `sdk-doc-generation.js` | Generate SDK with documentation |
| `docs-testing.js` | Validate specs in CI/CD |

## Dependencies

- @stoplight/spectral-cli
- @redocly/cli
- swagger-cli
- openapi-generator-cli
- oasdiff

## References

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Spectral Linter](https://stoplight.io/open-source/spectral)
- [ReDoc](https://redocly.com/redoc)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-001
**Category:** API Documentation
**Status:** Active
