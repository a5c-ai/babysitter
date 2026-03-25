---
name: smithy-sdk-generator
description: AWS Smithy-based SDK generation for enterprise-grade APIs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Smithy SDK Generator Skill

## Overview

This skill leverages AWS Smithy to generate enterprise-grade SDKs with AWS-style patterns including waiters, paginators, and automatic retries. Smithy provides a protocol-agnostic approach to API modeling.

## Capabilities

- Design Smithy models with traits for rich API semantics
- Generate SDKs with AWS-style patterns (waiters, paginators, retries)
- Implement custom code generation plugins
- Support multiple protocols (REST, RPC, etc.)
- Configure middleware and interceptor chains
- Generate comprehensive API documentation
- Implement client-side validation from constraints

## Target Processes

- SDK Code Generation Pipeline
- SDK Architecture Design
- Multi-Language SDK Strategy

## Integration Points

- AWS Smithy core and build plugins
- smithy-typescript for TypeScript SDK generation
- smithy-go for Go SDK generation
- smithy-rs for Rust SDK generation
- Custom code generators

## Input Requirements

- Smithy model files (.smithy)
- Trait configurations for behaviors
- Target language specifications
- Custom template overrides (if any)
- Protocol selection (restJson1, awsJson1_1, etc.)

## Output Artifacts

- Generated SDK source code
- API documentation
- Waiter configurations
- Paginator implementations
- Client configuration options
- Build artifacts per target language

## Usage Example

```yaml
skill:
  name: smithy-sdk-generator
  context:
    modelDirectory: ./model
    targetLanguages:
      - typescript
      - python
      - go
    protocol: restJson1
    generateWaiters: true
    generatePaginators: true
    customTraits: ./traits
```

## Best Practices

1. Use semantic traits to enrich API behavior
2. Define clear resource hierarchies
3. Implement proper pagination patterns
4. Add waiter definitions for async operations
5. Use validation constraints for input validation
6. Document all operations and shapes thoroughly
