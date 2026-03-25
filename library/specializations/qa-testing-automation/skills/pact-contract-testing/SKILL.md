---
name: pact-contract-testing
description: Consumer-driven contract testing with Pact framework. Generate consumer contracts, configure Pact Broker publishing, execute provider verification, detect breaking changes, and integrate with CI/CD pipelines.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: contract-testing
  backlog-id: SK-012
---

# pact-contract-testing

You are **pact-contract-testing** - a specialized skill for consumer-driven contract testing with the Pact framework, enabling reliable API integration testing between services.

## Overview

This skill enables AI-powered contract testing including:
- Generating consumer contracts (Pact files)
- Configuring Pact Broker publishing
- Provider verification execution
- Breaking change detection
- Webhook integration for CI/CD
- Can-i-deploy checks
- Contract versioning management
- Bidirectional contract testing

## Prerequisites

- Node.js, Java, or Python environment
- Pact library for your language
- Pact Broker (self-hosted or PactFlow)
- CI/CD pipeline access
- Consumer and provider applications

## Capabilities

### 1. Consumer Contract Generation

Create consumer-side contracts with Pact JS:

```javascript
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'frontend-app',
  provider: 'user-service',
  logLevel: 'info'
});

describe('User API Contract', () => {
  it('should return user by ID', async () => {
    // Arrange: Define expected interaction
    await provider
      .given('a user with ID 123 exists')
      .uponReceiving('a request for user 123')
      .withRequest({
        method: 'GET',
        path: '/api/users/123',
        headers: {
          Accept: 'application/json',
          Authorization: regex(/Bearer .+/, 'Bearer token123')
        }
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          id: like(123),
          email: like('user@example.com'),
          name: like('John Doe'),
          createdAt: like('2024-01-15T10:30:00Z'),
          roles: eachLike('user')
        }
      });

    // Act & Assert: Execute test
    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/api/users/123`, {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer token123'
        }
      });

      expect(response.status).toBe(200);
      const user = await response.json();
      expect(user.id).toBe(123);
    });
  });

  it('should return 404 for non-existent user', async () => {
    await provider
      .given('user 999 does not exist')
      .uponReceiving('a request for non-existent user')
      .withRequest({
        method: 'GET',
        path: '/api/users/999'
      })
      .willRespondWith({
        status: 404,
        body: {
          error: like('User not found'),
          code: like('USER_NOT_FOUND')
        }
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(`${mockServer.url}/api/users/999`);
      expect(response.status).toBe(404);
    });
  });
});
```

### 2. Provider Verification

Verify provider against contracts:

```javascript
import { Verifier } from '@pact-foundation/pact';

const verifier = new Verifier({
  provider: 'user-service',
  providerBaseUrl: 'http://localhost:3000',

  // Fetch pacts from broker
  pactBrokerUrl: 'https://your-broker.pactflow.io',
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,

  // Provider version
  providerVersion: process.env.GIT_COMMIT || '1.0.0',
  providerVersionBranch: process.env.GIT_BRANCH || 'main',

  // State handlers
  stateHandlers: {
    'a user with ID 123 exists': async () => {
      // Set up test data
      await db.users.create({ id: 123, email: 'user@example.com', name: 'John Doe' });
    },
    'user 999 does not exist': async () => {
      // Ensure user doesn't exist
      await db.users.delete(999);
    }
  },

  // Publish results
  publishVerificationResult: true,
  enablePending: true,
  includeWipPactsSince: '2024-01-01'
});

describe('Provider Verification', () => {
  beforeAll(async () => {
    // Start provider service
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should verify all consumer contracts', async () => {
    await verifier.verifyProvider();
  });
});
```

### 3. Pact Broker Publishing

Publish contracts to Pact Broker:

```javascript
import { Publisher } from '@pact-foundation/pact';

const publisher = new Publisher({
  pactFilesOrDirs: ['./pacts'],
  pactBroker: 'https://your-broker.pactflow.io',
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  consumerVersion: process.env.GIT_COMMIT || '1.0.0',
  branch: process.env.GIT_BRANCH || 'main',
  tags: [process.env.GIT_BRANCH || 'main']
});

await publisher.publishPacts();
```

### 4. Can-I-Deploy Check

Verify deployment safety:

```bash
# Check if consumer can be deployed
pact-broker can-i-deploy \
  --pacticipant frontend-app \
  --version $(git rev-parse HEAD) \
  --to-environment production \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN

# Check if provider can be deployed
pact-broker can-i-deploy \
  --pacticipant user-service \
  --version $(git rev-parse HEAD) \
  --to-environment production \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN

# Record deployment
pact-broker record-deployment \
  --pacticipant user-service \
  --version $(git rev-parse HEAD) \
  --environment production \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN
```

### 5. CI/CD Integration

GitHub Actions workflow:

```yaml
name: Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PACT_BROKER_URL: https://your-broker.pactflow.io
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract:consumer

      - name: Publish pacts
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version ${{ github.sha }} \
            --branch ${{ github.ref_name }} \
            --broker-base-url $PACT_BROKER_URL \
            --broker-token $PACT_BROKER_TOKEN

  provider-verification:
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start provider
        run: npm run start:test &

      - name: Verify provider
        run: npm run test:contract:provider

  can-i-deploy:
    runs-on: ubuntu-latest
    needs: [consumer-tests, provider-verification]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Can I deploy?
        run: |
          docker run --rm pactfoundation/pact-cli \
            broker can-i-deploy \
            --pacticipant frontend-app \
            --version ${{ github.sha }} \
            --to-environment production \
            --broker-base-url $PACT_BROKER_URL \
            --broker-token $PACT_BROKER_TOKEN
```

### 6. Webhook Configuration

Set up Pact Broker webhooks:

```bash
# Trigger provider verification on consumer change
pact-broker create-webhook \
  'https://api.github.com/repos/org/provider-repo/dispatches' \
  --request=POST \
  --header 'Accept: application/vnd.github.v3+json' \
  --header 'Authorization: Bearer ${GITHUB_TOKEN}' \
  --data '{"event_type": "contract_requiring_verification", "client_payload": {"pact_url": "${pactbroker.pactUrl}"}}' \
  --description "Trigger provider verification on contract change" \
  --contract-content-changed \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN
```

### 7. Bidirectional Contract Testing

Use with OpenAPI specifications:

```javascript
// Provider publishes OpenAPI spec
import { PactV3 } from '@pact-foundation/pact';

// Consumer tests against provider's published OpenAPI
const provider = new PactV3({
  consumer: 'frontend-app',
  provider: 'user-service',
  pactBrokerUrl: 'https://your-broker.pactflow.io',
  pactBrokerToken: process.env.PACT_BROKER_TOKEN
});

// Provider publishes OAS
// pact-broker publish-provider-contract \
//   openapi.yaml \
//   --provider user-service \
//   --provider-app-version $(git rev-parse HEAD) \
//   --branch main \
//   --content-type application/yaml \
//   --verification-success \
//   --broker-base-url https://your-broker.pactflow.io \
//   --broker-token $PACT_BROKER_TOKEN
```

### 8. Matchers and Generators

Use flexible matching:

```javascript
import { MatchersV3 } from '@pact-foundation/pact';

const {
  like,           // Type matching
  eachLike,       // Array matching
  regex,          // Regex matching
  integer,        // Integer type
  decimal,        // Decimal type
  boolean,        // Boolean type
  string,         // String type
  datetime,       // ISO datetime
  uuid,           // UUID format
  ipv4Address,    // IPv4 address
  email,          // Email format
  atLeastOneLike, // At least one item matching
  atMostLike,     // At most N items matching
  constrainedArrayLike // Min/max array
} = MatchersV3;

const userContract = {
  id: uuid(),
  email: email('test@example.com'),
  name: string('John Doe'),
  age: integer(25),
  balance: decimal(100.50),
  isActive: boolean(true),
  createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
  roles: eachLike('user'),
  preferences: like({
    theme: 'dark',
    notifications: true
  }),
  tags: constrainedArrayLike('tag', 1, 5)
};
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| PactFlow MCP Server | AI-powered contract testing in IDE | [PactFlow Blog](https://pactflow.io/blog/pactflow-mcp-server/) |

## Best Practices

1. **Consumer-first** - Start with consumer expectations
2. **Provider states** - Use meaningful state names
3. **Versioning** - Use git commit hashes for versions
4. **CI integration** - Automate all contract testing
5. **Can-i-deploy** - Always check before deployment
6. **Pending pacts** - Enable for new consumers
7. **WIP pacts** - Include work-in-progress pacts
8. **Branch awareness** - Tag pacts with branch names

## Process Integration

This skill integrates with the following processes:
- `contract-testing.js` - All phases of contract testing
- `api-testing.js` - API contract validation
- `continuous-testing.js` - CI/CD contract integration
- `quality-gates.js` - Contract verification gates

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "verify",
  "provider": "user-service",
  "providerVersion": "abc123",
  "consumers": [
    {
      "name": "frontend-app",
      "version": "def456",
      "status": "passed",
      "interactions": 5,
      "passed": 5,
      "failed": 0
    }
  ],
  "canDeploy": true,
  "environment": "production",
  "verificationUrl": "https://broker.pactflow.io/verifications/123"
}
```

## Error Handling

- Handle missing provider states gracefully
- Provide clear mismatch descriptions
- Log full request/response on failures
- Support retry for transient failures
- Document breaking changes clearly

## Constraints

- Contracts represent consumer needs, not full API
- Provider states must be reproducible
- Broker must be accessible from CI/CD
- Version management is critical
- Breaking changes require coordination
