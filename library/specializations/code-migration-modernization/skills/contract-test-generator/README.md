# Contract Test Generator Skill

## Overview

The Contract Test Generator skill creates contract tests for API migrations. It supports consumer-driven contracts and provider verification to prevent breaking changes.

## Quick Start

### Prerequisites

- Contract testing framework
- API specifications
- Consumer/provider access

### Basic Usage

1. **Define contracts**
   - Identify consumers
   - Document interactions
   - Set expectations

2. **Generate tests**
   ```bash
   # Using Pact
   pact-provider-verifier --provider-base-url=http://api
   ```

3. **Verify contracts**
   - Run provider verification
   - Check all consumers
   - Fix failures

## Features

### Contract Types

| Type | Direction | Use Case |
|------|-----------|----------|
| Consumer-Driven | Consumer -> Provider | Microservices |
| Provider-Driven | Provider -> Consumer | Public APIs |
| Bi-Directional | Both | Partnerships |

### Testing Workflow

1. Consumer writes contract
2. Contract published to broker
3. Provider verifies contract
4. Both deploy independently

## Configuration

```json
{
  "consumer": {
    "name": "frontend-app"
  },
  "provider": {
    "name": "user-service",
    "baseUrl": "http://localhost:8080"
  },
  "pact": {
    "broker": "https://pact.example.com",
    "publishContracts": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Pact](https://docs.pact.io/)
- [Spring Cloud Contract](https://spring.io/projects/spring-cloud-contract)
