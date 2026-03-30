# TypeScript SDK Specialist Skill

## Overview

The `typescript-sdk-specialist` skill provides comprehensive TypeScript SDK development capabilities. It enables creation of type-safe, tree-shakeable, and cross-platform API client libraries that work seamlessly in Node.js, browsers, and modern JavaScript runtimes.

## Quick Start

### Prerequisites

1. **Node.js** - v18 or later (or Bun/Deno)
2. **TypeScript** - v5.0 or later
3. **Build tool** - tsup, esbuild, or Rollup

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Initialize a new TypeScript SDK:

```bash
# Create project
npm init -y
npm install typescript tsup vitest -D

# Initialize TypeScript
npx tsc --init
```

## Usage

### Basic Operations

```bash
# Create SDK structure
/skill typescript-sdk-specialist scaffold --name my-api-sdk --namespace MyApi

# Generate API client
/skill typescript-sdk-specialist generate-client --spec openapi.yaml

# Configure dual module build
/skill typescript-sdk-specialist configure-build --esm --cjs

# Add interceptors
/skill typescript-sdk-specialist add-interceptor --type retry --maxRetries 3
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(typescriptSdkTask, {
  operation: 'scaffold',
  name: '@company/api-sdk',
  features: {
    dualModule: true,
    browserSupport: true,
    retryLogic: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Type-Safe Clients** | Strongly-typed API methods |
| **Dual Module** | ESM and CommonJS support |
| **Browser Support** | Works in browsers and Node.js |
| **Tree-Shakeable** | Optimal bundle sizes |
| **Interceptors** | Request/response middleware |
| **Retry Logic** | Exponential backoff |
| **Error Handling** | Typed error classes |
| **Pagination** | Async iterators for lists |

## Examples

### Example 1: SDK Client Usage

```typescript
import { MyServiceSDK } from '@company/myservice-sdk';

// Create SDK with API key
const sdk = MyServiceSDK.withApiKey('sk-xxx');

// Type-safe API calls
const user = await sdk.users.get('user-123');
console.log(user.name); // TypeScript knows this is a string

// Paginated listing
const users = await sdk.users.list({ limit: 20 });

// Async iteration over all items
for await (const user of sdk.users.listAll()) {
  console.log(user);
}
```

### Example 2: Error Handling

```typescript
import { MyServiceSDK, NotFoundError, RateLimitError } from '@company/myservice-sdk';

const sdk = MyServiceSDK.withApiKey('sk-xxx');

try {
  await sdk.users.get('nonexistent');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('User not found');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else {
    throw error;
  }
}
```

### Example 3: Custom Configuration

```typescript
import { MyServiceSDK } from '@company/myservice-sdk';

const sdk = new MyServiceSDK({
  accessToken: 'oauth-token',
  baseUrl: 'https://api.staging.myservice.com',
  timeout: 60000,
  retries: 5
});
```

### Example 4: Build Configuration

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: true
});
```

## Configuration

### Package.json Exports

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

### TypeScript Configuration

| Option | Value | Purpose |
|--------|-------|---------|
| `strict` | `true` | Maximum type safety |
| `moduleResolution` | `"bundler"` | Modern bundler support |
| `exactOptionalPropertyTypes` | `true` | Precise optional types |
| `noUncheckedIndexedAccess` | `true` | Safe array access |

## Process Integration

### Processes Using This Skill

1. **multi-language-sdk-strategy.js** - TypeScript patterns
2. **sdk-architecture-design.js** - SDK structure
3. **sdk-testing-strategy.js** - Testing setup
4. **package-distribution.js** - npm publishing

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createTypescriptSdkTask = defineTask({
  name: 'create-typescript-sdk',
  description: 'Create a TypeScript SDK with best practices',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create ${inputs.name} TypeScript SDK`,
      skill: {
        name: 'typescript-sdk-specialist',
        context: {
          operation: 'scaffold',
          name: inputs.name,
          features: inputs.features,
          apiSpec: inputs.apiSpec
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

## SDK Architecture Reference

### Recommended Structure

```
src/
  index.ts           # Main exports
  client.ts          # SDK client class
  base/
    client.ts        # HTTP client base
    types.ts         # Shared types
  api/
    users.ts         # Users API namespace
    orders.ts        # Orders API namespace
  models/
    index.ts         # Model exports
    user.ts          # User model
    order.ts         # Order model
  interceptors/
    auth.ts          # Auth interceptor
    retry.ts         # Retry interceptor
  errors/
    index.ts         # Error exports
    api-error.ts     # API error class
```

### Design Patterns

| Pattern | Description |
|---------|-------------|
| **Namespace Pattern** | Group related methods (sdk.users.get) |
| **Builder Pattern** | Fluent configuration |
| **Interceptor Pattern** | Request/response middleware |
| **Iterator Pattern** | Async pagination |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot use import` | Check module/type settings |
| `Types not found` | Verify exports in package.json |
| `Bundle too large` | Enable tree-shaking |
| `Browser errors` | Check polyfill requirements |

### Debug Mode

Enable verbose logging:

```typescript
const sdk = new MyServiceSDK({
  apiKey: 'sk-xxx',
  debug: true  // Logs all requests/responses
});
```

## Related Skills

- **openapi-codegen-orchestrator** - Generate from OpenAPI
- **python-sdk-specialist** - Python SDK patterns
- **contract-test-framework** - API contract testing
- **semver-analyzer** - Version management

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [tsup Documentation](https://tsup.egoist.dev/)
- [Azure SDK Design Guidelines](https://azure.github.io/azure-sdk/typescript_introduction.html)
- [Stripe TypeScript SDK](https://github.com/stripe/stripe-node)
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SDK-002
**Category:** Multi-Language SDK
**Status:** Active
