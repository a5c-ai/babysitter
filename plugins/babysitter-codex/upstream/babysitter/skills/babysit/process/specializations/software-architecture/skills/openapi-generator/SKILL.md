---
name: openapi-generator
description: Specialized skill for generating and validating OpenAPI 3.0/3.1 specifications. Supports code-first and spec-first approaches, schema inference, validation, and mock server generation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: api-design
  backlog-id: SK-SA-002
---

# openapi-generator

You are **openapi-generator** - a specialized skill for generating and validating OpenAPI specifications. This skill enables AI-powered API design with best practices for REST API documentation.

## Overview

This skill enables comprehensive OpenAPI specification management including:
- Generate OpenAPI 3.0/3.1 specifications from requirements
- Validate existing specifications against OpenAPI standards
- Infer schemas from code annotations or examples
- Generate client/server code from specifications
- Create mock servers for API testing
- Detect breaking changes between spec versions

## Prerequisites

- Node.js (v18+) for tooling
- Optional: spectral, redocly, swagger-cli
- Optional: Prism for mock servers

## Capabilities

### 1. OpenAPI Specification Generation

Generate complete OpenAPI specifications:

```yaml
openapi: 3.1.0
info:
  title: Payment API
  description: API for processing payments
  version: 1.0.0
  contact:
    name: API Support
    email: api@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server

tags:
  - name: payments
    description: Payment operations
  - name: refunds
    description: Refund operations

paths:
  /payments:
    post:
      operationId: createPayment
      summary: Create a new payment
      tags: [payments]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentRequest'
            examples:
              creditCard:
                summary: Credit card payment
                value:
                  amount: 9999
                  currency: USD
                  paymentMethod:
                    type: card
                    cardNumber: "4111111111111111"
      responses:
        '201':
          description: Payment created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Payment'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    PaymentRequest:
      type: object
      required:
        - amount
        - currency
        - paymentMethod
      properties:
        amount:
          type: integer
          minimum: 1
          description: Amount in smallest currency unit (cents)
        currency:
          type: string
          enum: [USD, EUR, GBP]
          description: ISO 4217 currency code
        paymentMethod:
          $ref: '#/components/schemas/PaymentMethod'
        metadata:
          type: object
          additionalProperties:
            type: string

    Payment:
      type: object
      properties:
        id:
          type: string
          format: uuid
        status:
          type: string
          enum: [pending, processing, completed, failed]
        amount:
          type: integer
        currency:
          type: string
        createdAt:
          type: string
          format: date-time

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object
```

### 2. Specification Validation

Validate OpenAPI specifications using multiple tools:

```bash
# Using Spectral (Stoplight)
spectral lint openapi.yaml --ruleset .spectral.yaml

# Using Redocly CLI
redocly lint openapi.yaml

# Using swagger-cli
swagger-cli validate openapi.yaml

# Using openapi-generator-cli
openapi-generator-cli validate -i openapi.yaml
```

### 3. Schema Inference

Infer OpenAPI schemas from examples:

```javascript
// Input: JSON examples
const examples = [
  { id: 1, name: "Product A", price: 29.99, inStock: true },
  { id: 2, name: "Product B", price: 49.99, inStock: false }
];

// Generated schema
const schema = {
  type: 'object',
  required: ['id', 'name', 'price', 'inStock'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    price: { type: 'number', format: 'double' },
    inStock: { type: 'boolean' }
  }
};
```

### 4. Breaking Change Detection

Detect breaking changes between API versions:

```bash
# Using openapi-diff
openapi-diff v1/openapi.yaml v2/openapi.yaml --format json

# Breaking changes include:
# - Removed endpoints
# - Required parameter added
# - Response schema changes
# - Security requirement changes
```

### 5. Mock Server Generation

Generate mock servers from specifications:

```bash
# Using Prism
prism mock openapi.yaml

# Using Mockoon
mockoon-cli start --data openapi.yaml

# Using openapi-mock-generator
openapi-mock-generator -i openapi.yaml -o ./mocks
```

### 6. Code Generation

Generate client and server code:

```bash
# Generate TypeScript client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/client

# Generate Node.js server stubs
openapi-generator-cli generate \
  -i openapi.yaml \
  -g nodejs-express-server \
  -o ./generated/server

# Generate Python client
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| mcp-openapi-schema | OpenAPI schema exploration for LLMs | [GitHub](https://github.com/hannesj/mcp-openapi-schema) |
| Apidog MCP Server | API documentation and code generation | [apidog.com](https://apidog.com/blog/top-10-mcp-servers-for-claude-code/) |

## Best Practices

### API Design Principles

1. **Use semantic versioning** - Include version in URL or header
2. **Consistent naming** - Use camelCase for JSON, kebab-case for URLs
3. **Proper HTTP methods** - GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove)
4. **Meaningful status codes** - 2xx success, 4xx client errors, 5xx server errors
5. **Pagination** - Use cursor-based or offset pagination for lists

### Schema Design

```yaml
# Good: Reusable components
components:
  schemas:
    PaginatedResponse:
      type: object
      properties:
        data:
          type: array
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        total: { type: integer }
        limit: { type: integer }
        offset: { type: integer }
        hasMore: { type: boolean }
```

### Security Definitions

```yaml
# Multiple security options
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    oauth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://auth.example.com/authorize
          tokenUrl: https://auth.example.com/token
          scopes:
            read: Read access
            write: Write access
```

## Process Integration

This skill integrates with the following processes:
- `api-design-specification.js` - Primary API design workflow
- `microservices-decomposition.js` - Service interface definition
- `system-design-review.js` - API review and validation

## Output Format

When generating specifications, provide structured output:

```json
{
  "operation": "generate",
  "version": "3.1.0",
  "status": "success",
  "specification": {
    "path": "./api/openapi.yaml",
    "format": "yaml",
    "endpoints": 15,
    "schemas": 23
  },
  "validation": {
    "errors": 0,
    "warnings": 2,
    "details": [
      { "level": "warning", "path": "/paths/users", "message": "Missing description" }
    ]
  },
  "artifacts": ["openapi.yaml", "openapi.json"],
  "mockServer": {
    "url": "http://localhost:4010",
    "tool": "prism"
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid schema reference` | $ref points to undefined | Define all referenced schemas |
| `Duplicate operationId` | Non-unique operation IDs | Ensure unique operationIds |
| `Invalid response code` | Invalid HTTP status code | Use standard status codes |
| `Missing required field` | Schema validation failure | Add all required fields |

## Constraints

- Follow OpenAPI specification standards
- Use semantic versioning for APIs
- Document all endpoints with descriptions
- Include examples for complex schemas
- Validate specifications before publishing
