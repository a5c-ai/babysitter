---
name: openapi
description: OpenAPI/Swagger specification, code generation, documentation, and validation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# OpenAPI Skill

Expert assistance for creating OpenAPI specifications and API documentation.

## Capabilities

- Write OpenAPI 3.x specifications
- Generate client/server code
- Create interactive documentation
- Validate API contracts
- Design request/response schemas

## Usage

Invoke this skill when you need to:
- Document REST APIs
- Generate API clients
- Validate API contracts
- Create interactive docs

## Specification Pattern

```yaml
openapi: 3.0.3
info:
  title: Users API
  version: 1.0.0

paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'

components:
  schemas:
    User:
      type: object
      required: [id, name, email]
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
```

## Best Practices

- Use $ref for reusable schemas
- Document all responses
- Include examples
- Version your specs

## Target Processes

- api-documentation
- api-design
- client-generation
