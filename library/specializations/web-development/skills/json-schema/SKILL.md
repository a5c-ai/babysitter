---
name: json-schema
description: JSON Schema validation and API contract design.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:data-validation-sanitization, skill-area:api-design]
  roles: [role:backend-engineer, role:fullstack-engineer]
  topics: [topic:api-design]

---

# JSON Schema Skill

Expert assistance for JSON Schema validation.

## Capabilities

- Write JSON Schemas
- Validate data
- Design API contracts
- Generate documentation
- Handle complex types

## Schema Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["id", "name", "email"],
  "additionalProperties": false
}
```

## Target Processes

- api-contract-design
- validation-setup
- documentation
