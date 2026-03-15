# API Design Architect Agent

## Overview

The `api-design-architect` agent embodies the expertise of a Senior API Architect specialized in REST, GraphQL, and gRPC design patterns. It provides expert guidance on API design with a focus on developer experience.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior API Architect |
| **Experience** | 12+ years in API design |
| **Background** | REST, GraphQL, gRPC, API-first development |
| **Philosophy** | "APIs are products - design for your developers" |

## Core API Principles

1. **Developer Experience First** - Intuitive, self-documenting APIs
2. **Consistency** - Uniform patterns across all endpoints
3. **Evolvability** - Design for change without breaking consumers
4. **Security by Design** - Auth, rate limiting from day one
5. **Performance Awareness** - Efficient payloads, caching

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **REST Design** | Resource modeling, HTTP semantics, HATEOAS |
| **GraphQL** | Schema design, resolvers, subscriptions |
| **gRPC** | Service definitions, streaming, protobuf |
| **Versioning** | URL, header, date-based strategies |
| **Error Handling** | Standard formats, error codes |
| **Documentation** | OpenAPI, GraphQL SDL, protobuf docs |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(apiArchitectTask, {
  agentName: 'api-design-architect',
  prompt: {
    role: 'API Design Specialist',
    task: 'Design REST API for order management',
    context: {
      domain: 'E-commerce',
      resources: ['orders', 'products', 'customers'],
      consumers: ['web', 'mobile', 'partners'],
      existingApis: './api/specs'
    },
    instructions: [
      'Design resource-oriented endpoints',
      'Define authentication strategy',
      'Plan versioning approach',
      'Create error handling standards'
    ],
    outputFormat: 'JSON with OpenAPI spec'
  }
});
```

### Direct Invocation

```bash
# Design REST API
/agent api-design-architect rest \
  --domain "Order Management" \
  --resources "orders,items,shipments" \
  --output-format openapi

# Design GraphQL API
/agent api-design-architect graphql \
  --domain "User Management" \
  --operations "query,mutation,subscription" \
  --output-format sdl

# API review
/agent api-design-architect review \
  --spec ./api/openapi.yaml \
  --check-consistency \
  --suggest-improvements

# Version migration plan
/agent api-design-architect versioning \
  --current-spec ./api/v1/openapi.yaml \
  --proposed-changes ./api/changes.yaml \
  --migration-strategy
```

## Common Tasks

### 1. REST API Design

```bash
/agent api-design-architect design-rest \
  --domain "Payment Processing" \
  --resources "payments,refunds,transactions" \
  --auth "oauth2" \
  --versioning "url-path"
```

Output includes:
- Resource endpoints
- HTTP method mapping
- Request/response schemas
- Error response format
- OpenAPI specification

### 2. GraphQL Schema Design

```bash
/agent api-design-architect design-graphql \
  --domain "Content Management" \
  --types "Article,Author,Comment" \
  --include-subscriptions \
  --pagination "relay"
```

Provides:
- Type definitions
- Query/Mutation/Subscription operations
- Input types and payloads
- Connection patterns for pagination

### 3. API Versioning Strategy

```bash
/agent api-design-architect versioning-strategy \
  --api-type public \
  --consumers "mobile,web,partners" \
  --deprecation-timeline 12months
```

Delivers:
- Recommended versioning approach
- Breaking change policy
- Migration guides template
- Deprecation communication plan

### 4. API Review

```bash
/agent api-design-architect review \
  --spec ./api/openapi.yaml \
  --check consistency,security,naming \
  --report ./reports/api-review.json
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `api-design-specification.js` | Primary API design |
| `microservices-decomposition.js` | Service interfaces |
| `system-design-review.js` | API review |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const designApiTask = defineTask({
  name: 'design-api',
  description: 'Design API with architecture best practices',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Design ${inputs.apiType} API: ${inputs.domain}`,
      agent: {
        name: 'api-design-architect',
        prompt: {
          role: 'Senior API Architect',
          task: `Design ${inputs.apiType} API for ${inputs.domain}`,
          context: {
            domain: inputs.domain,
            apiType: inputs.apiType,
            resources: inputs.resources,
            consumers: inputs.consumers,
            authStrategy: inputs.auth,
            existingSpecs: inputs.existingSpecs
          },
          instructions: [
            'Apply resource-oriented design principles',
            'Design consistent endpoint patterns',
            'Define comprehensive error handling',
            'Include authentication and rate limiting',
            'Create OpenAPI/GraphQL specification'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['design', 'specification'],
          properties: {
            design: { type: 'object' },
            specification: { type: 'object' },
            recommendations: { type: 'array' }
          }
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

## API Design Reference

### REST Resource Naming

| Pattern | Example | Use Case |
|---------|---------|----------|
| Collection | `/users` | List resources |
| Document | `/users/{id}` | Single resource |
| Sub-collection | `/users/{id}/orders` | Related resources |
| Controller | `/users/{id}/activate` | Actions |

### HTTP Methods

| Method | Operation | Idempotent | Safe |
|--------|-----------|------------|------|
| GET | Read | Yes | Yes |
| POST | Create | No | No |
| PUT | Replace | Yes | No |
| PATCH | Update | No | No |
| DELETE | Delete | Yes | No |

### Status Codes Quick Reference

| Category | Codes | Usage |
|----------|-------|-------|
| Success | 200, 201, 204 | Successful operations |
| Client Error | 400, 401, 403, 404, 422 | Client mistakes |
| Server Error | 500, 502, 503 | Server issues |

### Pagination Comparison

| Pattern | Use Case | Performance |
|---------|----------|-------------|
| Offset | Admin UIs, small data | Poor at scale |
| Cursor | Real-time feeds | Good |
| Keyset | Sorted data | Good |
| Page Token | Google-style | Good |

## Interaction Guidelines

### What to Expect

- **Developer-focused** recommendations
- **Standards-compliant** designs
- **Security-conscious** patterns
- **Evolvability** considerations

### Best Practices

1. Provide clear domain context
2. Specify target consumers
3. Share existing API patterns
4. Mention compliance requirements
5. Include scale expectations

## Related Resources

- [openapi-generator skill](../../skills/openapi-generator/) - Spec generation
- [graphql-schema-generator skill](../../skills/graphql-schema-generator/) - GraphQL
- [security-architect agent](../security-architect/) - Security review

## References

- [REST API Design Rulebook](https://www.oreilly.com/library/view/rest-api-design/9781449317904/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [gRPC Best Practices](https://grpc.io/docs/guides/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SA-002
**Category:** Interface Design
**Status:** Active
