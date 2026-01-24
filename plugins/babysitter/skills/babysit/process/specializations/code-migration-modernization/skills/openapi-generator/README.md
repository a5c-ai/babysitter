# OpenAPI Generator Skill

## Overview

The OpenAPI Generator skill creates OpenAPI specifications from code. It infers schemas, generates examples, and produces comprehensive API documentation.

## Quick Start

### Prerequisites

- Codebase with API endpoints
- Annotation support (optional)
- Target OpenAPI version

### Basic Usage

1. **Configure generator**
   ```bash
   # For TypeScript with tsoa
   npx tsoa spec
   ```

2. **Generate spec**
   - Parse code annotations
   - Infer schemas
   - Build spec file

3. **Generate docs**
   ```bash
   # Serve Swagger UI
   npx swagger-ui-express
   ```

## Features

### Generation Methods

| Method | Input | Automation |
|--------|-------|------------|
| Annotations | Code decorators | High |
| Types | TypeScript/Java | High |
| Runtime | Traffic capture | Medium |
| Manual | Hand-written | Low |

### Output Formats

- OpenAPI 3.0/3.1
- Swagger 2.0
- Postman collection
- AsyncAPI (for async)

## Configuration

```json
{
  "input": {
    "source": "./src/routes",
    "framework": "express",
    "annotationType": "jsdoc"
  },
  "output": {
    "format": "openapi-3.0",
    "file": "./api/openapi.yaml"
  },
  "options": {
    "generateExamples": true,
    "includeInternal": false
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [OpenAPI Specification](https://swagger.io/specification/)
