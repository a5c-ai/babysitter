---
name: contract-test-framework
description: Consumer-driven contract testing for SDK-API compatibility. Generate Pact consumer tests, verify provider contracts, configure Pact broker, and implement can-i-deploy checks.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: sdk-testing
  backlog-id: SK-SDK-003
---

# contract-test-framework

You are **contract-test-framework** - a specialized skill for consumer-driven contract testing between SDKs and APIs, ensuring compatibility and preventing breaking changes through automated verification.

## Overview

This skill enables AI-powered contract testing including:
- Generating Pact consumer contracts from SDK usage
- Configuring Pact Broker for contract management
- Provider verification against consumer contracts
- Can-i-deploy safety checks before releases
- Breaking change detection and alerting
- Webhook integration for automated verification
- Support for bidirectional contract testing

## Prerequisites

- Node.js 18+ or Python 3.8+
- Pact library for your SDK language
- Pact Broker (PactFlow recommended) or self-hosted
- CI/CD pipeline access
- Consumer SDK and provider API access

## Capabilities

### 1. Consumer Contract Generation for SDKs

Generate contracts from SDK tests:

```typescript
// tests/contracts/user-api.pact.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { MyServiceSDK } from '@company/myservice-sdk';

const { like, eachLike, regex, uuid, datetime, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'myservice-typescript-sdk',
  provider: 'myservice-api',
  logLevel: 'info'
});

describe('MyService SDK Contracts', () => {
  describe('Users API', () => {
    it('should get user by ID', async () => {
      const expectedUser = {
        id: uuid(),
        email: like('user@example.com'),
        name: like('John Doe'),
        createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        status: regex(/active|inactive|pending/, 'active')
      };

      await provider
        .given('a user with ID exists', { userId: 'user-123' })
        .uponReceiving('a request to get user by ID')
        .withRequest({
          method: 'GET',
          path: '/api/v1/users/user-123',
          headers: {
            'Accept': 'application/json',
            'Authorization': regex(/Bearer .+/, 'Bearer test-token')
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: expectedUser
        });

      await provider.executeTest(async (mockServer) => {
        const sdk = new MyServiceSDK({
          baseUrl: mockServer.url,
          accessToken: 'test-token'
        });

        const user = await sdk.users.get('user-123');

        expect(user).toBeDefined();
        expect(user.email).toMatch(/@/);
      });
    });

    it('should list users with pagination', async () => {
      await provider
        .given('users exist')
        .uponReceiving('a request to list users')
        .withRequest({
          method: 'GET',
          path: '/api/v1/users',
          query: {
            page: '1',
            limit: '20'
          }
        })
        .willRespondWith({
          status: 200,
          body: {
            data: eachLike({
              id: uuid(),
              email: like('user@example.com'),
              name: like('User Name')
            }),
            pagination: {
              page: integer(1),
              limit: integer(20),
              total: integer(100),
              hasMore: like(true)
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        const sdk = new MyServiceSDK({ baseUrl: mockServer.url });
        const response = await sdk.users.list({ page: 1, limit: 20 });

        expect(response.data).toBeInstanceOf(Array);
        expect(response.pagination.page).toBe(1);
      });
    });

    it('should create a new user', async () => {
      await provider
        .given('the system is ready')
        .uponReceiving('a request to create a user')
        .withRequest({
          method: 'POST',
          path: '/api/v1/users',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': regex(/Bearer .+/, 'Bearer test-token')
          },
          body: {
            email: like('newuser@example.com'),
            name: like('New User'),
            password: like('securePassword123')
          }
        })
        .willRespondWith({
          status: 201,
          body: {
            id: uuid(),
            email: like('newuser@example.com'),
            name: like('New User'),
            createdAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
          }
        });

      await provider.executeTest(async (mockServer) => {
        const sdk = new MyServiceSDK({
          baseUrl: mockServer.url,
          accessToken: 'test-token'
        });

        const user = await sdk.users.create({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'securePassword123'
        });

        expect(user.id).toBeDefined();
      });
    });

    it('should handle 404 for non-existent user', async () => {
      await provider
        .given('user does not exist', { userId: 'nonexistent' })
        .uponReceiving('a request for non-existent user')
        .withRequest({
          method: 'GET',
          path: '/api/v1/users/nonexistent'
        })
        .willRespondWith({
          status: 404,
          body: {
            error: {
              code: like('USER_NOT_FOUND'),
              message: like('User not found')
            }
          }
        });

      await provider.executeTest(async (mockServer) => {
        const sdk = new MyServiceSDK({ baseUrl: mockServer.url });

        await expect(sdk.users.get('nonexistent'))
          .rejects
          .toThrow('User not found');
      });
    });
  });
});
```

### 2. Multi-SDK Contract Testing

Test contracts for multiple SDK implementations:

```yaml
# pact-config.yaml
consumers:
  - name: myservice-typescript-sdk
    language: typescript
    version: ${GIT_COMMIT}
    branch: ${GIT_BRANCH}

  - name: myservice-python-sdk
    language: python
    version: ${GIT_COMMIT}
    branch: ${GIT_BRANCH}

  - name: myservice-java-sdk
    language: java
    version: ${GIT_COMMIT}
    branch: ${GIT_BRANCH}

provider:
  name: myservice-api
  baseUrl: http://localhost:3000

broker:
  url: https://your-broker.pactflow.io
  token: ${PACT_BROKER_TOKEN}
  publishResults: true

verification:
  enablePending: true
  wipPactsSince: '2024-01-01'
  consumerVersionSelectors:
    - matchingBranch: true
    - mainBranch: true
    - deployedOrReleased: true
```

### 3. Provider Verification

Verify API against all SDK contracts:

```typescript
// tests/contracts/provider-verification.ts
import { Verifier } from '@pact-foundation/pact';
import { startServer, stopServer, resetDatabase } from '../test-utils';

describe('Provider Verification', () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should verify all SDK contracts', async () => {
    const verifier = new Verifier({
      provider: 'myservice-api',
      providerBaseUrl: 'http://localhost:3000',

      // Pact Broker configuration
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,

      // Provider version
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      providerVersionBranch: process.env.GIT_BRANCH || 'main',

      // Consumer selection
      consumerVersionSelectors: [
        { matchingBranch: true },
        { mainBranch: true },
        { deployedOrReleased: true }
      ],

      // State handlers for test setup
      stateHandlers: {
        'a user with ID exists': async (params) => {
          await resetDatabase();
          await db.users.create({
            id: params.userId,
            email: 'user@example.com',
            name: 'John Doe'
          });
        },

        'users exist': async () => {
          await resetDatabase();
          await db.users.createMany([
            { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
            { id: 'user-2', email: 'user2@example.com', name: 'User 2' }
          ]);
        },

        'user does not exist': async (params) => {
          await resetDatabase();
          // Ensure user doesn't exist
          await db.users.delete(params.userId).catch(() => {});
        },

        'the system is ready': async () => {
          await resetDatabase();
        }
      },

      // Request filters
      requestFilter: (req, res, next) => {
        // Add test authentication
        if (!req.headers.authorization) {
          req.headers.authorization = 'Bearer test-token';
        }
        next();
      },

      // Publish results
      publishVerificationResult: true,
      enablePending: true,
      includeWipPactsSince: '2024-01-01'
    });

    await verifier.verifyProvider();
  });
});
```

### 4. CI/CD Pipeline Integration

Complete GitHub Actions workflow:

```yaml
name: SDK Contract Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PACT_BROKER_URL: https://your-broker.pactflow.io
  PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}

jobs:
  # Consumer SDK contract tests
  sdk-contracts:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        sdk: [typescript, python, java]

    steps:
      - uses: actions/checkout@v4

      - name: Setup SDK environment
        uses: ./.github/actions/setup-${{ matrix.sdk }}

      - name: Install dependencies
        run: |
          cd sdks/${{ matrix.sdk }}
          ${{ matrix.sdk == 'typescript' && 'npm ci' || matrix.sdk == 'python' && 'pip install -e .[dev]' || 'mvn install -DskipTests' }}

      - name: Run contract tests
        run: |
          cd sdks/${{ matrix.sdk }}
          ${{ matrix.sdk == 'typescript' && 'npm run test:contract' || matrix.sdk == 'python' && 'pytest tests/contracts' || 'mvn test -Dtest=*Pact*' }}

      - name: Publish contracts
        if: github.event_name == 'push'
        run: |
          npx @pact-foundation/pact-cli publish \
            sdks/${{ matrix.sdk }}/pacts \
            --consumer-app-version ${{ github.sha }} \
            --branch ${{ github.ref_name }} \
            --broker-base-url $PACT_BROKER_URL \
            --broker-token $PACT_BROKER_TOKEN

  # Provider verification
  provider-verification:
    runs-on: ubuntu-latest
    needs: sdk-contracts

    steps:
      - uses: actions/checkout@v4
        with:
          repository: your-org/myservice-api

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start provider
        run: npm run start:test &

      - name: Wait for provider
        run: npx wait-on http://localhost:3000/health

      - name: Verify contracts
        run: npm run test:contract:provider
        env:
          PROVIDER_VERSION: ${{ github.sha }}
          PROVIDER_BRANCH: ${{ github.ref_name }}

  # Deployment safety check
  can-i-deploy:
    runs-on: ubuntu-latest
    needs: [sdk-contracts, provider-verification]
    if: github.ref == 'refs/heads/main'

    strategy:
      matrix:
        participant:
          - myservice-typescript-sdk
          - myservice-python-sdk
          - myservice-java-sdk
          - myservice-api

    steps:
      - name: Can I deploy?
        run: |
          docker run --rm pactfoundation/pact-cli \
            broker can-i-deploy \
            --pacticipant ${{ matrix.participant }} \
            --version ${{ github.sha }} \
            --to-environment production \
            --broker-base-url $PACT_BROKER_URL \
            --broker-token ${{ secrets.PACT_BROKER_TOKEN }}

  # Record deployment
  record-deployment:
    runs-on: ubuntu-latest
    needs: can-i-deploy
    if: github.ref == 'refs/heads/main'

    strategy:
      matrix:
        participant:
          - myservice-typescript-sdk
          - myservice-python-sdk
          - myservice-java-sdk
          - myservice-api

    steps:
      - name: Record deployment
        run: |
          docker run --rm pactfoundation/pact-cli \
            broker record-deployment \
            --pacticipant ${{ matrix.participant }} \
            --version ${{ github.sha }} \
            --environment production \
            --broker-base-url $PACT_BROKER_URL \
            --broker-token ${{ secrets.PACT_BROKER_TOKEN }}
```

### 5. Webhook Configuration

Set up automated verification webhooks:

```bash
# Create webhook for SDK changes
pact-broker create-webhook \
  'https://api.github.com/repos/your-org/myservice-api/dispatches' \
  --request=POST \
  --header 'Accept: application/vnd.github.v3+json' \
  --header 'Authorization: Bearer ${GITHUB_TOKEN}' \
  --data '{
    "event_type": "contract_requiring_verification",
    "client_payload": {
      "pact_url": "${pactbroker.pactUrl}",
      "consumer_name": "${pactbroker.consumerName}",
      "provider_name": "${pactbroker.providerName}"
    }
  }' \
  --description "Trigger API verification on SDK contract change" \
  --contract-content-changed \
  --provider myservice-api \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN

# Create webhook for verification results
pact-broker create-webhook \
  'https://api.github.com/repos/your-org/myservice-sdk/statuses/${pactbroker.consumerVersionNumber}' \
  --request=POST \
  --header 'Authorization: Bearer ${GITHUB_TOKEN}' \
  --data '{
    "state": "${pactbroker.verificationResultSuccess ? \"success\" : \"failure\"}",
    "description": "Contract verification ${pactbroker.verificationResultSuccess ? \"passed\" : \"failed\"}",
    "context": "pact/provider-verification"
  }' \
  --description "Update SDK commit status on verification" \
  --provider-verification-published \
  --broker-base-url https://your-broker.pactflow.io \
  --broker-token $PACT_BROKER_TOKEN
```

### 6. Breaking Change Detection

Detect and handle breaking changes:

```typescript
// scripts/check-breaking-changes.ts
import { PactBrokerClient } from '@pact-foundation/pact';

async function checkBreakingChanges(
  provider: string,
  newVersion: string
): Promise<BreakingChangeReport> {
  const client = new PactBrokerClient({
    brokerBaseUrl: process.env.PACT_BROKER_URL!,
    token: process.env.PACT_BROKER_TOKEN
  });

  // Get current production version
  const prodVersion = await client.getLatestVersionForEnvironment(
    provider,
    'production'
  );

  // Compare contracts
  const comparison = await client.compareVersions(
    provider,
    prodVersion,
    newVersion
  );

  const breakingChanges: BreakingChange[] = [];

  for (const diff of comparison.differences) {
    if (diff.isBreaking) {
      breakingChanges.push({
        type: diff.type,
        path: diff.path,
        description: diff.description,
        affectedConsumers: diff.consumers
      });
    }
  }

  return {
    hasBreakingChanges: breakingChanges.length > 0,
    breakingChanges,
    recommendation: breakingChanges.length > 0
      ? 'Major version bump required'
      : 'Safe to release'
  };
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| PactFlow MCP Server | AI-powered contract testing | [PactFlow Blog](https://pactflow.io/blog/pactflow-mcp-server/) |
| Specmatic MCP Server | Contract testing and mocks | [GitHub](https://github.com/specmatic/specmatic-mcp-server) |

## Best Practices

1. **Consumer-first design** - Write consumer tests before implementation
2. **Meaningful states** - Use descriptive provider state names
3. **Version with git** - Use commit SHAs for versions
4. **Test all SDKs** - Ensure all language SDKs have contracts
5. **Can-i-deploy gates** - Block deployments without verification
6. **Webhook automation** - Trigger verification automatically
7. **Environment tracking** - Record deployments per environment
8. **Pending pacts** - Enable for new SDK versions

## Process Integration

This skill integrates with the following processes:
- `sdk-testing-strategy.js` - SDK testing patterns
- `compatibility-testing.js` - Cross-SDK compatibility
- `backward-compatibility-management.js` - Breaking change management
- `sdk-versioning-release-management.js` - Release coordination

## Output Format

```json
{
  "operation": "verify",
  "provider": "myservice-api",
  "providerVersion": "abc123",
  "consumers": [
    {
      "name": "myservice-typescript-sdk",
      "version": "def456",
      "status": "passed",
      "interactions": 12,
      "passed": 12,
      "failed": 0
    },
    {
      "name": "myservice-python-sdk",
      "version": "ghi789",
      "status": "passed",
      "interactions": 10,
      "passed": 10,
      "failed": 0
    }
  ],
  "canDeploy": true,
  "environment": "production",
  "verificationUrl": "https://broker.pactflow.io/matrix/provider/myservice-api/version/abc123"
}
```

## Error Handling

- Handle missing provider states gracefully
- Provide clear mismatch descriptions
- Log full request/response on failures
- Support retry for transient broker failures
- Document breaking changes clearly

## Constraints

- Contracts represent consumer needs only
- Provider states must be reproducible
- Broker must be accessible from CI/CD
- Version management is critical
- Breaking changes require coordination across SDKs
