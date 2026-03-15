---
name: contract-test-generator
description: Generate contract tests for API migrations with consumer-driven contracts and provider verification
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Contract Test Generator Skill

Generates contract tests for API migrations, supporting consumer-driven contracts, provider verification, and breaking change detection.

## Purpose

Enable API contract testing for:
- Consumer contract generation
- Provider verification
- Schema validation
- Breaking change detection
- Mock server generation

## Capabilities

### 1. Consumer Contract Generation
- Generate from API usage
- Extract from tests
- Build from specs
- Support multiple formats

### 2. Provider Verification
- Verify against contracts
- Test all consumers
- Check compatibility
- Document failures

### 3. Schema Validation
- Validate request schemas
- Check response schemas
- Verify data types
- Enforce constraints

### 4. Breaking Change Detection
- Detect field removals
- Find type changes
- Identify required additions
- Flag compatibility issues

### 5. Mock Server Generation
- Generate from contracts
- Support stub responses
- Handle scenarios
- Enable development isolation

### 6. Contract Versioning
- Track contract versions
- Manage compatibility
- Support migrations
- Document changes

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Pact | Consumer-driven contracts | CLI |
| Spring Cloud Contract | Java contracts | CLI |
| Dredd | API validation | CLI |
| Prism | Mock server | CLI |
| WireMock | Mock server | CLI |

## Output Schema

```json
{
  "generationId": "string",
  "timestamp": "ISO8601",
  "contracts": [
    {
      "consumer": "string",
      "provider": "string",
      "interactions": [
        {
          "description": "string",
          "request": {},
          "response": {}
        }
      ]
    }
  ],
  "verification": {
    "passed": "boolean",
    "results": []
  },
  "artifacts": {
    "contractFiles": [],
    "mockServerConfig": "string"
  }
}
```

## Integration with Migration Processes

- **api-modernization**: Contract verification
- **monolith-to-microservices**: Service contracts

## Related Skills

- `openapi-generator`: Spec generation
- `api-compatibility-analyzer`: Breaking changes

## Related Agents

- `regression-detector`: Regression prevention
- `cross-team-integrator`: Contract coordination
