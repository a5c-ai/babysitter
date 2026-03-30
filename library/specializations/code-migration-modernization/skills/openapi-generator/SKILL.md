---
name: openapi-generator
description: Generate OpenAPI specifications from code or legacy APIs with schema inference and documentation
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# OpenAPI Generator Skill

Generates OpenAPI specifications from code annotations, legacy APIs, or runtime analysis, with schema inference and documentation generation.

## Purpose

Enable API documentation for:
- Spec generation from code
- Schema inference
- Example generation
- Validation rule extraction
- Documentation generation

## Capabilities

### 1. Spec Generation from Code Annotations
- Parse JSDoc/Swagger annotations
- Extract from decorators
- Process code comments
- Support multiple languages

### 2. Schema Inference
- Infer from TypeScript types
- Extract from runtime samples
- Build from database models
- Derive from existing payloads

### 3. Example Generation
- Generate realistic examples
- Create edge case samples
- Produce validation examples
- Build test fixtures

### 4. Validation Rule Extraction
- Extract validation constraints
- Document required fields
- Map format rules
- Export enum values

### 5. Versioning Support
- Track API versions
- Generate diff between versions
- Document breaking changes
- Support multiple versions

### 6. Documentation Generation
- Generate Swagger UI
- Create ReDoc pages
- Export to Postman
- Build developer portals

## Tool Integrations

| Tool | Language | Integration Method |
|------|----------|-------------------|
| Swagger Codegen | Multi | CLI |
| OpenAPI Generator | Multi | CLI |
| springdoc | Java/Spring | Library |
| NSwag | .NET | CLI |
| tsoa | TypeScript | CLI |
| FastAPI | Python | Auto |

## Output Schema

```json
{
  "generationId": "string",
  "timestamp": "ISO8601",
  "specification": {
    "openapi": "string",
    "info": {},
    "paths": {},
    "components": {}
  },
  "artifacts": {
    "specFile": "string",
    "docsUrl": "string",
    "postmanCollection": "string"
  },
  "coverage": {
    "endpoints": "number",
    "documented": "number",
    "schemasGenerated": "number"
  }
}
```

## Integration with Migration Processes

- **api-modernization**: Spec generation
- **documentation-migration**: API docs

## Related Skills

- `api-inventory-scanner`: Endpoint discovery
- `api-compatibility-analyzer`: Version comparison

## Related Agents

- `api-modernization-architect`: API design
- `documentation-migration-agent`: Doc generation
