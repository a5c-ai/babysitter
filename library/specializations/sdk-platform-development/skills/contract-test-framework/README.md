# Contract Test Framework Skill

## Overview

The `contract-test-framework` skill provides consumer-driven contract testing capabilities for SDK-API compatibility. It enables automated verification that all SDK implementations correctly integrate with the API, preventing breaking changes and ensuring compatibility across multiple language SDKs.

## Quick Start

### Prerequisites

1. **Pact Library** - Language-specific Pact implementation
2. **Pact Broker** - PactFlow or self-hosted
3. **CI/CD Pipeline** - For automated verification

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install Pact for your language:

```bash
# TypeScript/JavaScript
npm install @pact-foundation/pact @pact-foundation/pact-cli

# Python
pip install pact-python

# Java - add to pom.xml
# au.com.dius.pact.consumer:junit5:4.6.5

# Go
go get github.com/pact-foundation/pact-go/v2
```

## Usage

### Basic Operations

```bash
# Generate consumer contract
/skill contract-test-framework generate-consumer \
  --consumer typescript-sdk \
  --provider myservice-api

# Verify provider
/skill contract-test-framework verify-provider \
  --provider myservice-api \
  --broker-url https://broker.pactflow.io

# Check deployment safety
/skill contract-test-framework can-i-deploy \
  --pacticipant typescript-sdk \
  --environment production

# Publish contracts
/skill contract-test-framework publish \
  --pacts ./pacts \
  --version $(git rev-parse HEAD)
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(contractTestTask, {
  operation: 'verify-provider',
  provider: 'myservice-api',
  brokerUrl: 'https://broker.pactflow.io'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Consumer Contracts** | Generate Pact files from SDK tests |
| **Provider Verification** | Verify API against all SDK contracts |
| **Multi-SDK Support** | Test TypeScript, Python, Java, Go SDKs |
| **Broker Integration** | Publish and manage contracts |
| **Can-I-Deploy** | Verify deployment safety |
| **Webhooks** | Automated verification triggers |
| **Breaking Changes** | Detect incompatible changes |
| **Environment Tracking** | Record deployments per environment |

## Examples

### Example 1: TypeScript SDK Contract

```typescript
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { MyServiceSDK } from '@company/sdk';

const { like, uuid } = MatchersV3;

const provider = new PactV3({
  consumer: 'myservice-typescript-sdk',
  provider: 'myservice-api'
});

it('should get user by ID', async () => {
  await provider
    .given('a user exists', { userId: 'user-123' })
    .uponReceiving('a request to get user')
    .withRequest({
      method: 'GET',
      path: '/api/users/user-123'
    })
    .willRespondWith({
      status: 200,
      body: { id: uuid(), name: like('John Doe') }
    });

  await provider.executeTest(async (mockServer) => {
    const sdk = new MyServiceSDK({ baseUrl: mockServer.url });
    const user = await sdk.users.get('user-123');
    expect(user.name).toBeDefined();
  });
});
```

### Example 2: Provider Verification

```typescript
import { Verifier } from '@pact-foundation/pact';

const verifier = new Verifier({
  provider: 'myservice-api',
  providerBaseUrl: 'http://localhost:3000',
  pactBrokerUrl: process.env.PACT_BROKER_URL,
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  stateHandlers: {
    'a user exists': async (params) => {
      await db.users.create({ id: params.userId, name: 'John Doe' });
    }
  },
  publishVerificationResult: true
});

await verifier.verifyProvider();
```

### Example 3: Can-I-Deploy Check

```bash
pact-broker can-i-deploy \
  --pacticipant myservice-typescript-sdk \
  --version $(git rev-parse HEAD) \
  --to-environment production \
  --broker-base-url https://broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN
```

### Example 4: CI/CD Pipeline

```yaml
jobs:
  sdk-contracts:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:contract
      - run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version ${{ github.sha }} \
            --broker-base-url $PACT_BROKER_URL

  can-i-deploy:
    needs: sdk-contracts
    steps:
      - run: |
          pact-broker can-i-deploy \
            --pacticipant myservice-sdk \
            --version ${{ github.sha }} \
            --to-environment production
```

## Configuration

### Pact Broker Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `PACT_BROKER_URL` | Broker URL | Yes |
| `PACT_BROKER_TOKEN` | Authentication token | Yes |
| `PACT_PUBLISH_RESULTS` | Publish verification results | No |

### Consumer Version Selectors

```typescript
consumerVersionSelectors: [
  { matchingBranch: true },      // Same branch as provider
  { mainBranch: true },          // Main branch
  { deployedOrReleased: true }   // In any environment
]
```

## Process Integration

### Processes Using This Skill

1. **sdk-testing-strategy.js** - SDK testing patterns
2. **compatibility-testing.js** - Cross-SDK compatibility
3. **backward-compatibility-management.js** - Breaking changes
4. **sdk-versioning-release-management.js** - Release gates

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const verifyContractsTask = defineTask({
  name: 'verify-sdk-contracts',
  description: 'Verify all SDK contracts against API',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Verify ${inputs.provider} Contracts`,
      skill: {
        name: 'contract-test-framework',
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

## Matcher Reference

| Matcher | Description | Example |
|---------|-------------|---------|
| `like(value)` | Match by type | `like('string')` |
| `eachLike(value)` | Array of type | `eachLike({id: 1})` |
| `regex(pattern, value)` | Regex match | `regex(/\d+/, '123')` |
| `uuid()` | UUID format | `uuid()` |
| `datetime(format)` | DateTime | `datetime("yyyy-MM-dd")` |
| `integer(value)` | Integer type | `integer(42)` |

## MCP Server Reference

### PactFlow MCP Server

AI-powered contract testing integration.

**Features:**
- Contract generation assistance
- Verification troubleshooting
- Breaking change analysis
- Best practice recommendations

**Documentation:** https://pactflow.io/blog/pactflow-mcp-server/

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Provider state not found` | Add state handler |
| `Verification failed` | Check provider implementation |
| `Cannot connect to broker` | Verify URL and token |
| `Version not found` | Publish contracts first |

### Debug Mode

```bash
LOG_LEVEL=debug npm run test:contract
```

## Related Skills

- **api-diff-analyzer** - Detect API changes
- **semver-analyzer** - Version management
- **openapi-codegen-orchestrator** - SDK generation
- **typescript-sdk-specialist** - TypeScript patterns

## References

- [Pact Documentation](https://docs.pact.io/)
- [PactFlow](https://pactflow.io/)
- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [PactFlow MCP Server](https://pactflow.io/blog/pactflow-mcp-server/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SDK-003
**Category:** SDK Testing
**Status:** Active
