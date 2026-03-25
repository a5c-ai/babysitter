---
name: openapi-swagger
description: Expert skill for OpenAPI/Swagger specification analysis, validation, and documentation generation. Parse and validate specs, detect breaking changes, generate code samples, and lint for best practices.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-001
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# OpenAPI/Swagger Skill

Expert skill for OpenAPI/Swagger specification analysis and documentation generation.

## Capabilities

- Parse and validate OpenAPI 3.x and Swagger 2.0 specifications
- Generate API documentation from specs (ReDoc, Swagger UI)
- Detect breaking changes between API versions
- Validate request/response examples against schemas
- Generate code samples in multiple languages
- Lint OpenAPI specs for best practices (Spectral rules)
- Convert between OpenAPI formats (YAML/JSON, version migration)

## Usage

Invoke this skill when you need to:
- Validate and lint OpenAPI specifications
- Generate API reference documentation
- Detect breaking changes between API versions
- Create code samples from API specs
- Migrate between OpenAPI versions

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| specPath | string | Yes | Path to OpenAPI/Swagger spec file |
| action | string | Yes | validate, lint, generate-docs, diff, generate-samples |
| outputDir | string | No | Output directory for generated content |
| targetVersion | string | No | Target OpenAPI version for migration |
| languages | array | No | Languages for code sample generation |
| rulesets | array | No | Spectral ruleset files to apply |

### Input Example

```json
{
  "specPath": "./api/openapi.yaml",
  "action": "lint",
  "rulesets": [".spectral.yaml"],
  "outputDir": "docs/api"
}
```

## Output Structure

### Validation Output

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "path": "paths./users.get.responses.200",
      "message": "Response should have a description",
      "severity": "warning"
    }
  ],
  "info": {
    "title": "My API",
    "version": "1.0.0",
    "openApiVersion": "3.1.0"
  }
}
```

### Breaking Changes Output

```json
{
  "breaking": [
    {
      "type": "removed-endpoint",
      "path": "DELETE /users/{id}",
      "description": "Endpoint removed in new version"
    },
    {
      "type": "changed-type",
      "path": "POST /users.requestBody.email",
      "from": "string",
      "to": "object"
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

## OpenAPI Specification Patterns

### OpenAPI 3.1 Template

```yaml
openapi: 3.1.0
info:
  title: My API
  description: API description with **Markdown** support
  version: 1.0.0
  contact:
    name: API Support
    email: support@example.com
  license:
    name: MIT
    identifier: MIT

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

tags:
  - name: users
    description: User management operations

paths:
  /users:
    get:
      operationId: listUsers
      summary: List all users
      description: Returns a paginated list of users
      tags:
        - users
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
              examples:
                success:
                  $ref: '#/components/examples/UserListExample'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          format: uuid
          description: Unique identifier
        email:
          type: string
          format: email
          description: User email address
        name:
          type: string
          description: Display name
        createdAt:
          type: string
          format: date-time

    UserList:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1

    LimitParam:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

## Spectral Configuration

### .spectral.yaml

```yaml
extends:
  - spectral:oas

rules:
  # Require descriptions
  operation-description: warn
  operation-operationId: error

  # Naming conventions
  operation-operationId-valid-in-url: true
  path-params: error

  # Security
  operation-security-defined: error

  # Custom rules
  path-must-have-tag:
    description: Every path must have at least one tag
    given: $.paths[*][*]
    severity: warn
    then:
      field: tags
      function: length
      functionOptions:
        min: 1

  require-example:
    description: Responses should have examples
    given: $.paths[*][*].responses[*].content[*]
    severity: info
    then:
      field: examples
      function: truthy
```

## Code Sample Generation

### Generated Samples

```javascript
// JavaScript (fetch)
const response = await fetch('https://api.example.com/v1/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

```python
# Python (requests)
import requests

response = requests.get(
    'https://api.example.com/v1/users',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    }
)
data = response.json()
```

```bash
# cURL
curl -X GET 'https://api.example.com/v1/users' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

## Workflow

1. **Parse specification** - Load and parse OpenAPI/Swagger file
2. **Validate syntax** - Check for schema compliance
3. **Lint for best practices** - Apply Spectral rules
4. **Generate documentation** - Create ReDoc/Swagger UI output
5. **Generate samples** - Create code examples
6. **Report findings** - Output validation results

## Dependencies

```json
{
  "devDependencies": {
    "@stoplight/spectral-cli": "^6.11.0",
    "swagger-cli": "^4.0.0",
    "@redocly/cli": "^1.0.0",
    "openapi-generator-cli": "^2.7.0",
    "oasdiff": "^1.0.0"
  }
}
```

## CLI Commands

```bash
# Validate spec
npx @redocly/cli lint openapi.yaml

# Spectral linting
npx spectral lint openapi.yaml

# Generate ReDoc documentation
npx @redocly/cli build-docs openapi.yaml -o docs/index.html

# Detect breaking changes
oasdiff breaking old-api.yaml new-api.yaml

# Generate code samples
npx openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./sdk
```

## Best Practices Applied

- Use $ref for reusable components
- Include examples for all schemas
- Document all error responses
- Use semantic versioning
- Include operationId for all operations
- Tag all endpoints
- Provide server URLs for all environments

## References

- OpenAPI Specification: https://spec.openapis.org/oas/latest.html
- Spectral: https://stoplight.io/open-source/spectral
- ReDoc: https://redocly.com/redoc
- Swagger UI: https://swagger.io/tools/swagger-ui/
- OpenAPI Generator: https://openapi-generator.tech/

## Target Processes

- api-doc-generation.js
- api-reference-docs.js
- sdk-doc-generation.js
- docs-testing.js
