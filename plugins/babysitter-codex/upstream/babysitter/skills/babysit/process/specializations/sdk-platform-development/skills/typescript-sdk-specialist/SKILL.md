---
name: typescript-sdk-specialist
description: TypeScript SDK development with Node.js and browser support. Design SDK architecture, implement type-safe API clients, support ESM and CommonJS modules, and configure bundling for browsers.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: multi-language-sdk
  backlog-id: SK-SDK-002
---

# typescript-sdk-specialist

You are **typescript-sdk-specialist** - a specialized skill for TypeScript SDK development, enabling creation of type-safe, tree-shakeable, and cross-platform API client libraries.

## Overview

This skill enables AI-powered TypeScript SDK development including:
- Designing TypeScript SDK architecture
- Implementing type-safe API clients
- Supporting ESM and CommonJS dual modules
- Configuring bundling for browsers
- Implementing retry logic and error handling
- Adding request/response interceptors
- Supporting multiple runtimes (Node.js, Deno, Bun, browsers)

## Prerequisites

- Node.js 18+ (or Bun/Deno)
- TypeScript 5.0+
- Package manager (npm, pnpm, or yarn)
- Build tools (tsup, esbuild, or Rollup)
- Testing framework (Vitest recommended)

## Capabilities

### 1. SDK Architecture Design

Design a modular, type-safe SDK architecture:

```typescript
// src/client.ts
import { BaseClient, ClientConfig } from './base';
import { UsersApi } from './api/users';
import { OrdersApi } from './api/orders';
import { AuthInterceptor } from './interceptors/auth';
import { RetryInterceptor } from './interceptors/retry';

export interface SDKConfig extends ClientConfig {
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
  retries?: number;
  baseUrl?: string;
}

export class MyServiceSDK {
  private readonly client: BaseClient;

  // API namespaces
  public readonly users: UsersApi;
  public readonly orders: OrdersApi;

  constructor(config: SDKConfig) {
    this.client = new BaseClient({
      baseUrl: config.baseUrl ?? 'https://api.myservice.com',
      timeout: config.timeout ?? 30000,
      interceptors: [
        new AuthInterceptor(config),
        new RetryInterceptor({ maxRetries: config.retries ?? 3 })
      ]
    });

    // Initialize API namespaces
    this.users = new UsersApi(this.client);
    this.orders = new OrdersApi(this.client);
  }

  /**
   * Create SDK instance with API key authentication
   */
  static withApiKey(apiKey: string, config?: Partial<SDKConfig>): MyServiceSDK {
    return new MyServiceSDK({ ...config, apiKey });
  }

  /**
   * Create SDK instance with OAuth token
   */
  static withAccessToken(accessToken: string, config?: Partial<SDKConfig>): MyServiceSDK {
    return new MyServiceSDK({ ...config, accessToken });
  }
}
```

### 2. Type-Safe API Client

Implement strongly-typed API methods:

```typescript
// src/api/users.ts
import { BaseClient, RequestOptions } from '../base';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ListUsersParams,
  PaginatedResponse
} from '../models';

export class UsersApi {
  constructor(private readonly client: BaseClient) {}

  /**
   * Get a user by ID
   * @param id - The user's unique identifier
   * @param options - Request options
   * @returns The user object
   * @throws {NotFoundError} When user doesn't exist
   * @throws {ApiError} On other API errors
   */
  async get(id: string, options?: RequestOptions): Promise<User> {
    return this.client.get<User>(`/users/${id}`, options);
  }

  /**
   * List users with pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of users
   */
  async list(params?: ListUsersParams): Promise<PaginatedResponse<User>> {
    return this.client.get<PaginatedResponse<User>>('/users', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        sort: params?.sort,
        filter: params?.filter
      }
    });
  }

  /**
   * Create a new user
   * @param data - User creation data
   * @returns The created user
   * @throws {ValidationError} When data is invalid
   */
  async create(data: CreateUserRequest): Promise<User> {
    return this.client.post<User>('/users', { body: data });
  }

  /**
   * Update an existing user
   * @param id - The user's unique identifier
   * @param data - Fields to update
   * @returns The updated user
   */
  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return this.client.patch<User>(`/users/${id}`, { body: data });
  }

  /**
   * Delete a user
   * @param id - The user's unique identifier
   */
  async delete(id: string): Promise<void> {
    return this.client.delete(`/users/${id}`);
  }

  /**
   * Iterate over all users with automatic pagination
   * @param params - Query parameters
   * @yields User objects
   */
  async *listAll(params?: Omit<ListUsersParams, 'page'>): AsyncGenerator<User> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.list({ ...params, page });

      for (const user of response.data) {
        yield user;
      }

      hasMore = response.hasMore;
      page++;
    }
  }
}
```

### 3. HTTP Client Base Implementation

Create a flexible HTTP client base:

```typescript
// src/base/client.ts
import { ApiError, NetworkError, TimeoutError } from '../errors';

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

export interface RequestInterceptor {
  onRequest?(config: RequestConfig): RequestConfig | Promise<RequestConfig>;
  onResponse?<T>(response: T): T | Promise<T>;
  onError?(error: Error): Error | Promise<Error>;
}

export class BaseClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private interceptors: RequestInterceptor[];

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultTimeout = config.timeout ?? 30000;
    this.interceptors = config.interceptors ?? [];
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions & { body?: unknown }): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async put<T>(path: string, options?: RequestOptions & { body?: unknown }): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  async patch<T>(path: string, options?: RequestOptions & { body?: unknown }): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions & { body?: unknown }
  ): Promise<T> {
    let config: RequestConfig = {
      method,
      url: `${this.baseUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers
      },
      params: options?.params,
      body: options?.body,
      timeout: options?.timeout ?? this.defaultTimeout,
      signal: options?.signal
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        config = await interceptor.onRequest(config);
      }
    }

    try {
      const response = await this.fetch(config);

      let result = await this.parseResponse<T>(response);

      // Apply response interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.onResponse) {
          result = await interceptor.onResponse(result);
        }
      }

      return result;
    } catch (error) {
      let finalError = error as Error;

      // Apply error interceptors
      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          finalError = await interceptor.onError(finalError);
        }
      }

      throw finalError;
    }
  }

  private async fetch(config: RequestConfig): Promise<Response> {
    const url = new URL(config.url);

    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal ?? controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${config.timeout}ms`);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new NetworkError('Network request failed', { cause: error });
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.text() as unknown as T;
  }

  private async createApiError(response: Response): Promise<ApiError> {
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    return new ApiError(
      (body as any)?.message ?? `HTTP ${response.status}`,
      response.status,
      (body as any)?.code,
      body
    );
  }
}
```

### 4. Dual ESM/CommonJS Package Configuration

Configure package.json for dual module support:

```json
{
  "name": "@company/myservice-sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for MyService API",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
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
    },
    "./models": {
      "import": {
        "types": "./dist/models/index.d.ts",
        "default": "./dist/models/index.js"
      },
      "require": {
        "types": "./dist/models/index.d.cts",
        "default": "./dist/models/index.cjs"
      }
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "sideEffects": false
}
```

### 5. Build Configuration with tsup

Configure tsup for optimal builds:

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'models/index': 'src/models/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  minify: false,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  external: [],
  noExternal: [],
  // Browser bundle
  esbuildOptions(options, context) {
    if (context.format === 'esm') {
      options.platform = 'neutral';
      options.conditions = ['browser', 'import', 'default'];
    }
  }
});
```

### 6. Error Handling

Implement comprehensive error types:

```typescript
// src/errors/index.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly errors: ValidationIssue[]
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(
    public readonly retryAfter: number
  ) {
    super('Rate limit exceeded', 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

### 7. Retry Interceptor

Implement retry logic with exponential backoff:

```typescript
// src/interceptors/retry.ts
import { RateLimitError, NetworkError, TimeoutError } from '../errors';

export interface RetryConfig {
  maxRetries: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: Error) => boolean;
}

export class RetryInterceptor implements RequestInterceptor {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig) {
    this.config = {
      maxRetries: config.maxRetries,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      retryCondition: config.retryCondition ?? this.defaultRetryCondition
    };
  }

  private defaultRetryCondition(error: Error): boolean {
    if (error instanceof RateLimitError) return true;
    if (error instanceof NetworkError) return true;
    if (error instanceof TimeoutError) return true;
    if (error instanceof ApiError && error.status >= 500) return true;
    return false;
  }

  async onError(error: Error): Promise<Error> {
    // Retry logic is handled in the request wrapper
    return error;
  }
}

// Usage in client
async function withRetry<T>(
  fn: () => Promise<T>,
  config: Required<RetryConfig>
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!config.retryCondition(lastError) || attempt === config.maxRetries) {
        throw lastError;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        config.maxDelay
      );

      if (lastError instanceof RateLimitError && lastError.retryAfter) {
        await sleep(lastError.retryAfter * 1000);
      } else {
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 8. TypeScript Configuration

Optimal tsconfig.json for SDK development:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| Claude Agent SDK | Official TypeScript SDK | [GitHub](https://github.com/anthropics/claude-agent-sdk-typescript) |
| developer-kit | Skill building patterns | [GitHub](https://github.com/giuseppe-trisciuoglio/developer-kit) |

## Best Practices

1. **Type safety first** - Use strict TypeScript settings
2. **Tree-shakeable exports** - Named exports over default
3. **Dual module support** - ESM and CommonJS
4. **Comprehensive errors** - Typed error classes
5. **Automatic retry** - Exponential backoff with jitter
6. **Abort support** - AbortController integration
7. **Minimal dependencies** - Reduce bundle size
8. **Runtime agnostic** - Support multiple JS runtimes

## Process Integration

This skill integrates with the following processes:
- `multi-language-sdk-strategy.js` - Language-specific patterns
- `sdk-architecture-design.js` - Architecture decisions
- `sdk-testing-strategy.js` - Testing patterns
- `package-distribution.js` - npm publishing

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "create-sdk",
  "language": "typescript",
  "features": {
    "dualModule": true,
    "browserSupport": true,
    "typeSafety": "strict",
    "treeshaking": true
  },
  "structure": {
    "entryPoints": ["index.ts", "models/index.ts"],
    "apiClasses": ["UsersApi", "OrdersApi"],
    "models": 15,
    "interceptors": ["AuthInterceptor", "RetryInterceptor"]
  },
  "bundleSize": {
    "esm": "12.5kb",
    "cjs": "14.2kb",
    "minified": "8.3kb"
  }
}
```

## Error Handling

- Provide typed error classes
- Include request correlation IDs
- Support error cause chaining
- Log actionable error messages
- Handle timeout gracefully

## Constraints

- TypeScript 5.0+ required for modern features
- Browser support requires polyfills for older browsers
- Bundle size impacts download times
- Type generation can be slow for large APIs
- Some features may not work in all runtimes
