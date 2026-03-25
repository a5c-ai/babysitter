---
name: openapi-spec-generator
description: Automated OpenAPI specification generation from code annotations, comments, and interface definitions
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# OpenAPI Spec Generator Skill

## Overview

This skill automates the generation of OpenAPI 3.x specifications from code annotations, comments, and interface definitions. It parses source code to extract API endpoints, schemas, and documentation to produce comprehensive and accurate API specifications.

## Capabilities

- Parse code to extract API endpoints and schemas from annotations
- Generate OpenAPI 3.x specifications in YAML or JSON format
- Validate spec completeness and correctness against OpenAPI standards
- Auto-update specs from code changes with incremental generation
- Support multiple frameworks (Express, FastAPI, Spring, ASP.NET, etc.)
- Extract request/response schemas from TypeScript types, Python type hints, Go structs
- Generate examples from code-level documentation

## Target Processes

- API Design Specification
- API Documentation System
- SDK Code Generation Pipeline

## Integration Points

- Code analysis tools (AST parsers)
- Schema validators (Spectral, openapi-spec-validator)
- Swagger/OpenAPI tooling ecosystem
- IDE extensions for spec preview

## Input Requirements

- Source code with API route definitions
- Annotation/decorator conventions used in the codebase
- Target OpenAPI version (3.0.x or 3.1.x)
- Output format preference (YAML/JSON)

## Output Artifacts

- OpenAPI specification file (openapi.yaml or openapi.json)
- Validation report with any issues found
- Schema extraction summary
- Change diff from previous spec version (if applicable)

## Usage Example

```yaml
skill:
  name: openapi-spec-generator
  context:
    sourceDirectory: ./src/api
    framework: express
    outputFormat: yaml
    openapiVersion: "3.1.0"
    includeExamples: true
```

## Best Practices

1. Use consistent annotation patterns across the codebase
2. Include JSDoc/docstrings for all endpoints
3. Define reusable schema components
4. Validate generated specs before publishing
5. Version control generated specifications
