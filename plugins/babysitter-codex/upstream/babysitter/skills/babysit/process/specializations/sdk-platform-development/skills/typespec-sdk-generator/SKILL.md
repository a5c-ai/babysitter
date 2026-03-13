---
name: typespec-sdk-generator
description: Microsoft TypeSpec-based API and SDK generation
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# TypeSpec SDK Generator Skill

## Overview

This skill utilizes Microsoft TypeSpec (formerly Cadl) to design APIs and generate multi-language SDKs following Azure SDK guidelines. TypeSpec provides a concise, type-safe language for API definition.

## Capabilities

- Design APIs using TypeSpec language
- Generate multi-language SDKs (TypeScript, Python, Java, C#, Go)
- Emit OpenAPI and other specification formats
- Apply Azure SDK style guidelines automatically
- Implement decorators for rich API semantics
- Support versioning and deprecation patterns
- Generate strongly-typed clients

## Target Processes

- SDK Code Generation Pipeline
- API Design Specification
- Multi-Language SDK Strategy

## Integration Points

- TypeSpec compiler and emitters
- AutoRest for SDK generation
- Azure SDK code generation pipeline
- OpenAPI emitters
- Custom emitter development

## Input Requirements

- TypeSpec model files (.tsp)
- Emitter configurations per target
- Versioning requirements
- Style guide preferences
- Custom decorators (if any)

## Output Artifacts

- Generated SDK source code per language
- OpenAPI specifications
- JSON schemas
- API documentation
- Client library packages

## Usage Example

```yaml
skill:
  name: typespec-sdk-generator
  context:
    modelDirectory: ./typespec
    emitters:
      - "@azure-tools/typespec-ts"
      - "@azure-tools/typespec-python"
      - "@typespec/openapi3"
    applyAzureGuidelines: true
    apiVersion: "2024-01-01"
```

## Best Practices

1. Use namespaces to organize API structure
2. Leverage decorators for documentation and behavior
3. Implement proper versioning with @versioned
4. Use templates for reusable patterns
5. Define clear model inheritance hierarchies
6. Apply Azure SDK guidelines for consistency
