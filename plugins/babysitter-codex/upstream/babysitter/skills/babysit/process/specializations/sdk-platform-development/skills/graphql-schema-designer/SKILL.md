---
name: graphql-schema-designer
description: GraphQL schema design and optimization with federation support
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# GraphQL Schema Designer Skill

## Overview

This skill specializes in designing, optimizing, and maintaining GraphQL schemas with support for schema stitching, federation, and advanced patterns. It ensures type-safe, performant, and well-documented GraphQL APIs.

## Capabilities

- Design type-safe GraphQL schemas following best practices
- Implement schema stitching and Apollo Federation
- Optimize query complexity and configure depth limits
- Generate comprehensive schema documentation
- Design efficient resolver patterns
- Implement pagination (Relay connections, offset-based)
- Configure subscriptions and real-time features
- Validate schema against design guidelines

## Target Processes

- API Design Specification
- Multi-Language SDK Strategy
- SDK Architecture Design

## Integration Points

- Apollo Server/Client
- Hasura GraphQL Engine
- graphql-codegen for type generation
- GraphQL Inspector for schema validation
- Relay compiler

## Input Requirements

- Domain model or entity definitions
- Query requirements and use cases
- Performance requirements (complexity limits)
- Federation requirements (if microservices)

## Output Artifacts

- GraphQL SDL schema files
- Federation subgraph configurations
- Type definitions for client generation
- Schema documentation
- Query complexity analysis report

## Usage Example

```yaml
skill:
  name: graphql-schema-designer
  context:
    domainModel: ./docs/domain-model.md
    federationEnabled: true
    complexityLimit: 1000
    depthLimit: 10
    generateDocumentation: true
```

## Best Practices

1. Use meaningful type and field names
2. Implement proper nullability patterns
3. Design for pagination from the start
4. Document all types and fields
5. Use interfaces for polymorphism
6. Implement proper error handling with union types
