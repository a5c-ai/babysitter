# API Design Reviewer Agent

## Overview

The `api-design-reviewer` agent embodies the expertise of a Principal API Architect with deep knowledge of industry-leading API design patterns. It reviews API designs against style guides from Google, Microsoft, Stripe, and other API-first companies, identifying usability issues and suggesting improvements.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Principal API Architect |
| **Experience** | 12+ years in API design |
| **Background** | API-first companies, style guide author |
| **Philosophy** | "APIs are UIs for developers" |

## Core Principles

1. **Consistency** - Uniform patterns across endpoints
2. **Predictability** - Developers can guess behavior
3. **Simplicity** - Easy things easy, complex possible
4. **Discoverability** - Self-documenting APIs
5. **Evolvability** - Design for change
6. **Developer Experience** - Optimize for productivity

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **REST Design** | URL structure, methods, responses |
| **Naming** | Field naming, conventions |
| **Errors** | Error handling, codes |
| **Versioning** | Strategy, deprecation |
| **Auth** | OAuth, API keys, JWT |
| **Pagination** | Offset, cursor, keyset |
| **Documentation** | OpenAPI completeness |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(apiDesignReviewTask, {
  agentName: 'api-design-reviewer',
  prompt: {
    role: 'Principal API Architect',
    task: 'Review the user management API design',
    context: {
      spec: await readFile('openapi.yaml'),
      guidelines: 'Google API Design Guide'
    },
    instructions: [
      'Review against industry standards',
      'Identify usability issues',
      'Suggest improvements',
      'Rate overall design quality'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full API review
/agent api-design-reviewer review \
  --spec openapi.yaml \
  --guidelines google,stripe

# Endpoint review
/agent api-design-reviewer review-endpoint \
  --spec openapi.yaml \
  --path "/users" \
  --method POST

# Naming review
/agent api-design-reviewer review-naming \
  --spec openapi.yaml

# Error handling review
/agent api-design-reviewer review-errors \
  --spec openapi.yaml
```

## Common Tasks

### 1. Full API Design Review

```bash
/agent api-design-reviewer review \
  --spec openapi.yaml \
  --output-format detailed
```

Output includes:
- Overall design score
- Category-specific findings
- Industry benchmark comparison
- Prioritized recommendations

### 2. Naming Convention Review

```bash
/agent api-design-reviewer review-naming \
  --spec openapi.yaml
```

Reviews:
- Resource naming
- Field naming
- Query parameters
- Header naming

### 3. Error Handling Review

```bash
/agent api-design-reviewer review-errors \
  --spec openapi.yaml
```

Checks:
- HTTP status code usage
- Error response structure
- Error code taxonomy
- Actionable messages

### 4. Versioning Strategy Review

```bash
/agent api-design-reviewer review-versioning \
  --spec openapi.yaml \
  --strategy url
```

Evaluates:
- Version approach
- Breaking change handling
- Deprecation policy
- Migration support

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `api-design-specification.js` | Spec review and approval |
| `sdk-architecture-design.js` | SDK-friendly design |
| `developer-experience-optimization.js` | DX review |
| `backward-compatibility-management.js` | Change review |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const reviewApiDesignTask = defineTask({
  name: 'review-api-design',
  description: 'Review API design against industry standards',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Review ${inputs.apiName} API Design`,
      agent: {
        name: 'api-design-reviewer',
        prompt: {
          role: 'Principal API Architect',
          task: 'Comprehensive API design review',
          context: {
            spec: inputs.spec,
            guidelines: inputs.guidelines,
            existingIssues: inputs.knownIssues
          },
          instructions: [
            'Review resource naming and URLs',
            'Check HTTP method usage',
            'Validate error handling',
            'Review authentication approach',
            'Assess pagination strategy',
            'Compare against industry leaders'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['score', 'findings', 'recommendations'],
          properties: {
            score: { type: 'number' },
            findings: { type: 'array' },
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

## Review Checklist Reference

### REST Design

- [ ] Resources use plural nouns
- [ ] URLs are RESTful and intuitive
- [ ] HTTP methods used correctly
- [ ] Proper status codes

### Naming

- [ ] camelCase for fields
- [ ] Consistent patterns
- [ ] Descriptive names
- [ ] Standard suffixes

### Errors

- [ ] Consistent structure
- [ ] Machine-readable codes
- [ ] Human-readable messages
- [ ] Actionable details

### Authentication

- [ ] Clear mechanism
- [ ] Proper 401/403 usage
- [ ] Scope documentation
- [ ] Security best practices

## Industry Standards Reference

| Standard | Focus Area |
|----------|------------|
| [Google API Design Guide](https://cloud.google.com/apis/design) | General REST design |
| [Microsoft REST Guidelines](https://github.com/microsoft/api-guidelines) | Enterprise patterns |
| [Stripe API Reference](https://stripe.com/docs/api) | Payment APIs |
| [Twilio API Reference](https://www.twilio.com/docs/api) | Communication APIs |
| [JSON:API](https://jsonapi.org/) | Response structure |
| [OpenAPI Initiative](https://www.openapis.org/) | Specification format |

## Interaction Guidelines

### What to Expect

- **Constructive feedback** with clear rationale
- **Evidence-based** recommendations from standards
- **Prioritized** findings by impact
- **Educational** explanations of best practices

### Best Practices

1. Provide complete OpenAPI spec
2. Specify target audience (internal/external)
3. Note any constraints or legacy requirements
4. Share existing style guide if applicable

## Related Resources

- [openapi-codegen-orchestrator skill](../../skills/openapi-codegen-orchestrator/) - SDK generation
- [api-diff-analyzer skill](../../skills/api-diff-analyzer/) - Change detection
- [compatibility-auditor agent](../compatibility-auditor/) - Breaking changes

## References

- [Google API Design Guide](https://cloud.google.com/apis/design)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Stripe API Design](https://stripe.com/blog/api-versioning)
- [API Stylebook](http://apistylebook.com/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SDK-001
**Category:** API Design
**Status:** Active
