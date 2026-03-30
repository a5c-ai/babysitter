# OpenAPI Generator Skill

## Overview

The `openapi-generator` skill provides specialized capabilities for generating and validating OpenAPI 3.0/3.1 specifications. It supports both code-first and spec-first approaches to API design.

## Quick Start

### Prerequisites

1. **Node.js** (v18+) - For tooling
2. **Optional Tools** - spectral, redocly-cli, openapi-generator-cli, prism

### Installation

The skill is included in the babysitter-sdk. For enhanced capabilities:

```bash
# Install Spectral for linting
npm install -g @stoplight/spectral-cli

# Install Redocly CLI
npm install -g @redocly/cli

# Install OpenAPI Generator CLI
npm install -g @openapitools/openapi-generator-cli

# Install Prism for mocking
npm install -g @stoplight/prism-cli
```

## Usage

### Basic Operations

```bash
# Generate OpenAPI spec from requirements
/skill openapi-generator create \
  --name "Payment API" \
  --resources "payments,refunds,transactions" \
  --output ./api/openapi.yaml

# Validate existing specification
/skill openapi-generator validate \
  --input ./api/openapi.yaml \
  --ruleset strict

# Generate mock server
/skill openapi-generator mock \
  --spec ./api/openapi.yaml \
  --port 4010
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(openapiTask, {
  mode: 'generate',
  name: 'User API',
  version: '1.0.0',
  resources: ['users', 'profiles', 'settings'],
  outputFormat: 'yaml',
  outputPath: './api/openapi.yaml'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Spec Generation** | Create OpenAPI specs from requirements |
| **Validation** | Lint and validate specifications |
| **Schema Inference** | Generate schemas from examples |
| **Breaking Change Detection** | Compare spec versions |
| **Mock Server** | Generate mock APIs from specs |
| **Code Generation** | Generate client/server code |

## Examples

### Example 1: Create API Specification

```bash
/skill openapi-generator create \
  --name "E-commerce API" \
  --version "1.0.0" \
  --resources "products,orders,customers,payments" \
  --auth "bearer,apiKey" \
  --output ./api/openapi.yaml
```

### Example 2: Validate and Lint

```bash
/skill openapi-generator validate \
  --input ./api/openapi.yaml \
  --ruleset .spectral.yaml \
  --format json \
  --output ./reports/api-lint.json
```

### Example 3: Detect Breaking Changes

```bash
/skill openapi-generator diff \
  --base ./api/v1/openapi.yaml \
  --head ./api/v2/openapi.yaml \
  --fail-on-breaking
```

### Example 4: Generate TypeScript Client

```bash
/skill openapi-generator codegen \
  --input ./api/openapi.yaml \
  --generator typescript-axios \
  --output ./src/api-client
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAPI_GENERATOR_CLI` | Path to generator CLI | `openapi-generator-cli` |
| `SPECTRAL_RULESET` | Default Spectral ruleset | `.spectral.yaml` |
| `PRISM_PORT` | Default mock server port | `4010` |

### Skill Configuration

```yaml
# .babysitter/skills/openapi-generator.yaml
openapi-generator:
  defaultVersion: "3.1.0"
  outputFormat: yaml
  validation:
    ruleset: .spectral.yaml
    strictMode: true
  codeGen:
    defaultGenerator: typescript-axios
    additionalProperties:
      npmName: "@company/api-client"
      supportsES6: true
  mock:
    port: 4010
    cors: true
```

### Spectral Ruleset Example

```yaml
# .spectral.yaml
extends: ["spectral:oas"]
rules:
  operation-operationId: error
  operation-description: warn
  info-contact: warn
  oas3-api-servers: error

  # Custom rules
  path-must-have-tag:
    description: Every path must have a tag
    given: "$.paths[*][*]"
    then:
      field: tags
      function: truthy
```

## Process Integration

### Processes Using This Skill

| Process | Role |
|---------|------|
| `api-design-specification.js` | Primary API design |
| `microservices-decomposition.js` | Service interfaces |
| `system-design-review.js` | API validation |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const generateApiSpecTask = defineTask({
  name: 'generate-api-spec',
  description: 'Generate OpenAPI specification',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate OpenAPI Spec: ${inputs.name}`,
      skill: {
        name: 'openapi-generator',
        context: {
          mode: inputs.mode || 'generate',
          name: inputs.name,
          version: inputs.version,
          resources: inputs.resources,
          outputFormat: inputs.format || 'yaml',
          outputPath: inputs.outputPath,
          includeExamples: true,
          includeSecurity: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### mcp-openapi-schema

Exposes OpenAPI schema information to LLMs for exploration.

**Features:**
- Schema exploration
- Endpoint discovery
- Type introspection

**GitHub:** https://github.com/hannesj/mcp-openapi-schema

### Apidog MCP Server

Full API lifecycle management with AI-powered code generation.

**Features:**
- API documentation
- DTO generation
- Controller scaffolding

**Documentation:** https://apidog.com/

## API Design Best Practices

### Resource Naming

| Pattern | Example | Use Case |
|---------|---------|----------|
| Collection | `/users` | List resources |
| Document | `/users/{id}` | Single resource |
| Sub-collection | `/users/{id}/orders` | Related resources |
| Controller | `/users/{id}/activate` | Actions |

### HTTP Methods

| Method | Operation | Idempotent |
|--------|-----------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace | Yes |
| PATCH | Update | No |
| DELETE | Delete | Yes |

### Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable | Semantic error |
| 500 | Server Error | Unexpected error |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Invalid $ref` | Check schema references exist |
| `operationId collision` | Use unique operation IDs |
| `Validation fails` | Review Spectral output |
| `Mock server errors` | Validate spec before mocking |

### Debug Mode

```bash
DEBUG=openapi-generator /skill openapi-generator validate \
  --input ./api/openapi.yaml \
  --verbose
```

## Related Skills

- **graphql-schema-generator** - GraphQL schema generation
- **api-mock-server** - Mock server management
- **swagger-ui-deployer** - Documentation deployment

## References

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Spectral](https://stoplight.io/open-source/spectral)
- [Redocly CLI](https://redocly.com/docs/cli/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Prism](https://stoplight.io/open-source/prism)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SA-002
**Category:** API Design
**Status:** Active
