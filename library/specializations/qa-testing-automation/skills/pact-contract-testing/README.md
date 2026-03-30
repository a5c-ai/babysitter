# Pact Contract Testing Skill

## Overview

The `pact-contract-testing` skill provides consumer-driven contract testing with the Pact framework. It enables AI-powered contract testing workflows including consumer contract generation, provider verification, Pact Broker integration, and CI/CD pipeline support.

## Quick Start

### Prerequisites

1. **Node.js** - v18 or later (or Java/Python for those implementations)
2. **Pact Library** - @pact-foundation/pact
3. **Pact Broker** - PactFlow or self-hosted broker

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install Pact:

```bash
# JavaScript/TypeScript
npm install @pact-foundation/pact

# CLI tools
npm install -g @pact-foundation/pact-cli

# Python
pip install pact-python

# Java - add to pom.xml
# <dependency>
#   <groupId>au.com.dius.pact.consumer</groupId>
#   <artifactId>junit5</artifactId>
#   <version>4.6.5</version>
# </dependency>
```

## Usage

### Basic Operations

```bash
# Generate consumer contract
/skill pact-contract-testing generate-consumer --consumer frontend --provider api

# Verify provider contracts
/skill pact-contract-testing verify-provider --provider api --broker-url https://broker.pactflow.io

# Publish contracts to broker
/skill pact-contract-testing publish --pacts ./pacts --version $(git rev-parse HEAD)

# Check deployment safety
/skill pact-contract-testing can-i-deploy --pacticipant api --environment production
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(pactContractTask, {
  operation: 'verify-provider',
  provider: 'user-service',
  brokerUrl: 'https://your-broker.pactflow.io'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Consumer Contracts** | Generate Pact files from consumer tests |
| **Provider Verification** | Verify provider against contracts |
| **Broker Integration** | Publish and manage contracts |
| **Can-I-Deploy** | Verify deployment safety |
| **Webhooks** | Automated verification triggers |
| **Versioning** | Contract version management |
| **Breaking Changes** | Detect incompatible changes |

## Examples

### Example 1: Consumer Contract Test

```javascript
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike } = MatchersV3;

const provider = new PactV3({
  consumer: 'frontend-app',
  provider: 'user-service'
});

describe('User API Contract', () => {
  it('should return user by ID', async () => {
    await provider
      .given('a user exists')
      .uponReceiving('a request for a user')
      .withRequest({
        method: 'GET',
        path: '/api/users/123'
      })
      .willRespondWith({
        status: 200,
        body: {
          id: like(123),
          name: like('John Doe'),
          email: like('john@example.com')
        }
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/api/users/123`);
      expect(response.status).toBe(200);
    });
  });
});
```

### Example 2: Provider Verification

```javascript
import { Verifier } from '@pact-foundation/pact';

const verifier = new Verifier({
  provider: 'user-service',
  providerBaseUrl: 'http://localhost:3000',
  pactBrokerUrl: process.env.PACT_BROKER_URL,
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  providerVersion: process.env.GIT_SHA,
  publishVerificationResult: true,
  stateHandlers: {
    'a user exists': async () => {
      await db.users.create({ id: 123, name: 'John Doe' });
    }
  }
});

await verifier.verifyProvider();
```

### Example 3: CI/CD Pipeline

```yaml
name: Contract Tests

on: [push]

jobs:
  consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:contract
      - run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version ${{ github.sha }} \
            --broker-base-url ${{ secrets.PACT_BROKER_URL }} \
            --broker-token ${{ secrets.PACT_BROKER_TOKEN }}

  can-i-deploy:
    needs: consumer
    runs-on: ubuntu-latest
    steps:
      - run: |
          docker run --rm pactfoundation/pact-cli \
            broker can-i-deploy \
            --pacticipant frontend-app \
            --version ${{ github.sha }} \
            --to-environment production \
            --broker-base-url ${{ secrets.PACT_BROKER_URL }} \
            --broker-token ${{ secrets.PACT_BROKER_TOKEN }}
```

### Example 4: Record Deployment

```bash
# After successful deployment
pact-broker record-deployment \
  --pacticipant user-service \
  --version $(git rev-parse HEAD) \
  --environment production \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PACT_BROKER_URL` | Pact Broker URL | Required |
| `PACT_BROKER_TOKEN` | Broker authentication token | Required |
| `PACT_PUBLISH_RESULTS` | Publish verification results | `true` |

### Skill Configuration

```yaml
# .babysitter/skills/pact-contract-testing.yaml
pact-contract-testing:
  brokerUrl: https://your-broker.pactflow.io
  publishResults: true
  enablePending: true
  wipPactsSince: '2024-01-01'
  environments:
    - development
    - staging
    - production
```

## Matcher Reference

| Matcher | Description | Example |
|---------|-------------|---------|
| `like(value)` | Match by type | `like(123)` |
| `eachLike(value)` | Array of type | `eachLike('item')` |
| `regex(pattern, value)` | Regex match | `regex(/\d+/, '123')` |
| `integer(value)` | Integer type | `integer(42)` |
| `uuid()` | UUID format | `uuid()` |
| `datetime(format)` | DateTime | `datetime("yyyy-MM-dd")` |

## Process Integration

### Processes Using This Skill

1. **contract-testing.js** - All phases of contract testing
2. **api-testing.js** - API contract validation
3. **continuous-testing.js** - CI/CD contract integration
4. **quality-gates.js** - Contract verification gates

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const verifyContractsTask = defineTask({
  name: 'verify-contracts',
  description: 'Verify provider contracts',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Verify ${inputs.provider} Contracts`,
      skill: {
        name: 'pact-contract-testing',
        context: {
          operation: 'verify-provider',
          provider: inputs.provider,
          brokerUrl: inputs.brokerUrl,
          publishResults: true
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

### PactFlow MCP Server

AI-powered contract testing integration in your IDE.

**Features:**
- Contract generation assistance
- Verification help
- Breaking change detection
- Best practice recommendations

**Documentation:** https://pactflow.io/blog/pactflow-mcp-server/

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Provider state not found` | Add state handler in verification config |
| `Verification failed` | Check provider implementation matches contract |
| `Cannot connect to broker` | Verify broker URL and token |
| `Version not found` | Ensure contracts are published first |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
LOG_LEVEL=debug npm run test:contract
```

## Related Skills

- **api-testing** - REST/GraphQL API testing
- **playwright-e2e** - E2E integration testing
- **docker-test-environments** - Test environment setup

## References

- [Pact Documentation](https://docs.pact.io/)
- [PactFlow](https://pactflow.io/)
- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [Pact JS](https://github.com/pact-foundation/pact-js)
- [PactFlow MCP Server](https://pactflow.io/blog/pactflow-mcp-server/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-012
**Category:** Contract Testing
**Status:** Active
