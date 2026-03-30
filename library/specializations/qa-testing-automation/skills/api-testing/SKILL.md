---
name: API Testing
description: Comprehensive API testing for REST and GraphQL endpoints with contract validation
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# API Testing Skill

## Overview

This skill provides expert-level capabilities for API testing, covering REST, GraphQL, authentication flows, schema validation, and contract testing integration.

## Capabilities

### REST API Testing
- Execute API tests with Supertest/REST Assured
- HTTP method testing (GET, POST, PUT, PATCH, DELETE)
- Header and cookie manipulation
- File upload/download testing

### GraphQL Testing
- Query and mutation testing
- Subscription testing
- Schema introspection validation
- Variable and fragment handling

### Schema Validation
- Validate OpenAPI/Swagger schemas
- Response schema validation with Ajv/Joi
- Generate test cases from API specifications
- Contract validation

### Authentication Testing
- OAuth 2.0 flow testing
- JWT token validation
- API key authentication
- Session-based authentication

### Performance Assertions
- Response time validation
- Throughput measurements
- Rate limiting verification

### Contract Testing
- Consumer contract generation
- Provider verification
- Pact integration

## Target Processes

- `api-testing.js` - API test implementation
- `contract-testing.js` - Contract testing workflows
- `security-testing.js` - API security testing
- `performance-testing.js` - API performance validation

## Dependencies

- `supertest` - HTTP assertions (Node.js)
- `axios` - HTTP client
- `ajv` - JSON schema validation
- `graphql-request` - GraphQL client

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'api-testing',
    context: {
      action: 'execute-tests',
      baseUrl: 'https://api.example.com',
      specPath: 'openapi.yaml',
      authType: 'bearer',
      validateSchema: true
    }
  }
}
```

## Configuration

The skill can auto-discover API specifications from OpenAPI/Swagger files and generate comprehensive test suites.
