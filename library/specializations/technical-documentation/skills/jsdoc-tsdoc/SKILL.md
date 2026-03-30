---
name: jsdoc-tsdoc
description: JavaScript and TypeScript documentation generation using JSDoc and TSDoc. Parse source code, generate API documentation, validate coverage, and integrate with TypeDoc for comprehensive developer documentation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-014
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# JSDoc/TSDoc Skill

Generate and validate JavaScript and TypeScript documentation using industry-standard JSDoc and TSDoc conventions with TypeDoc integration.

## Capabilities

- Parse JSDoc comments from JavaScript source code
- Parse TSDoc comments from TypeScript source code
- Generate API documentation with TypeDoc
- Validate documentation coverage and completeness
- Enforce documentation standards with ESLint plugins
- Support custom JSDoc/TSDoc tags
- Type inference and documentation alignment
- Generate multiple output formats (HTML, Markdown, JSON)

## Usage

Invoke this skill when you need to:
- Document JavaScript/TypeScript libraries and APIs
- Generate API reference documentation
- Audit documentation coverage
- Set up automated documentation pipelines
- Validate doc comments match implementation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectPath | string | Yes | Root path of the JS/TS project |
| entryPoints | array | No | Specific files/directories to document |
| outputDir | string | No | Documentation output directory (default: docs) |
| outputFormat | string | No | html, markdown, json (default: html) |
| includePrivate | boolean | No | Include private members (default: false) |
| coverageThreshold | number | No | Minimum documentation coverage % |
| customTags | array | No | Additional JSDoc/TSDoc tags to recognize |

### Input Example

```json
{
  "projectPath": "./packages/sdk",
  "entryPoints": ["src/index.ts", "src/client.ts"],
  "outputDir": "docs/api",
  "outputFormat": "html",
  "coverageThreshold": 80,
  "customTags": ["@alpha", "@beta", "@experimental"]
}
```

## Output Structure

```
docs/api/
├── index.html           # Documentation home
├── modules.html         # Module index
├── classes/
│   ├── Client.html      # Class documentation
│   └── Config.html
├── interfaces/
│   ├── Options.html     # Interface documentation
│   └── Response.html
├── functions/
│   └── helpers.html     # Function documentation
├── types/
│   └── aliases.html     # Type alias documentation
├── assets/
│   ├── main.js
│   └── style.css
└── coverage.json        # Documentation coverage report
```

## JSDoc Comment Patterns

### Function Documentation

```javascript
/**
 * Authenticates a user with the API.
 *
 * @param {string} username - The user's username
 * @param {string} password - The user's password
 * @returns {Promise<AuthResult>} Authentication result with token
 * @throws {AuthError} When credentials are invalid
 * @example
 * const result = await authenticate('user@example.com', 'password');
 * console.log(result.token);
 *
 * @since 1.0.0
 * @see {@link logout} for ending sessions
 */
async function authenticate(username, password) {
  // Implementation
}
```

### Class Documentation

```javascript
/**
 * HTTP client for API communication.
 *
 * @class
 * @extends EventEmitter
 * @implements {Disposable}
 *
 * @example
 * const client = new ApiClient({ baseUrl: 'https://api.example.com' });
 * const response = await client.get('/users');
 */
class ApiClient extends EventEmitter {
  /**
   * Creates a new API client instance.
   *
   * @param {ClientOptions} options - Client configuration
   * @param {string} options.baseUrl - Base URL for API requests
   * @param {number} [options.timeout=30000] - Request timeout in ms
   */
  constructor(options) {
    // Implementation
  }

  /**
   * Performs a GET request.
   *
   * @param {string} path - Request path
   * @param {RequestOptions} [options] - Additional options
   * @returns {Promise<Response>} The response
   */
  async get(path, options) {
    // Implementation
  }
}
```

## TSDoc Comment Patterns

### Package Documentation

```typescript
/**
 * SDK for interacting with the Example API.
 *
 * @remarks
 * This package provides a type-safe client for the Example API.
 * It supports both browser and Node.js environments.
 *
 * @packageDocumentation
 */
```

### Function with Overloads

```typescript
/**
 * Fetches data from the API.
 *
 * @param url - The endpoint URL
 * @returns The response data
 *
 * @example
 * ```typescript
 * const users = await fetch<User[]>('/api/users');
 * ```
 *
 * @public
 */
export async function fetch<T>(url: string): Promise<T>;

/**
 * Fetches data with custom options.
 *
 * @param url - The endpoint URL
 * @param options - Request options
 * @returns The response data
 *
 * @public
 */
export async function fetch<T>(url: string, options: FetchOptions): Promise<T>;
```

### Interface Documentation

```typescript
/**
 * Configuration options for the API client.
 *
 * @remarks
 * All timeout values are in milliseconds.
 *
 * @example
 * ```typescript
 * const config: ClientConfig = {
 *   baseUrl: 'https://api.example.com',
 *   timeout: 5000,
 *   retries: 3
 * };
 * ```
 *
 * @public
 */
export interface ClientConfig {
  /**
   * Base URL for all API requests.
   * @remarks Must include protocol (https://)
   */
  baseUrl: string;

  /**
   * Request timeout in milliseconds.
   * @defaultValue 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests.
   * @defaultValue 0
   */
  retries?: number;

  /**
   * Custom headers to include with every request.
   * @beta
   */
  headers?: Record<string, string>;
}
```

## TypeDoc Configuration

### typedoc.json

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "name": "My SDK",
  "readme": "README.md",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "excludeExternals": true,
  "categorizeByGroup": true,
  "categoryOrder": [
    "Client",
    "Configuration",
    "Types",
    "Utilities",
    "*"
  ],
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  },
  "plugin": [
    "typedoc-plugin-markdown"
  ],
  "theme": "default",
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  }
}
```

### ESLint Documentation Rules

```json
{
  "plugins": ["jsdoc"],
  "extends": ["plugin:jsdoc/recommended-typescript"],
  "rules": {
    "jsdoc/require-jsdoc": ["warn", {
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true,
        "ArrowFunctionExpression": false
      },
      "publicOnly": true
    }],
    "jsdoc/require-description": "warn",
    "jsdoc/require-param-description": "warn",
    "jsdoc/require-returns-description": "warn",
    "jsdoc/check-tag-names": ["error", {
      "definedTags": ["alpha", "beta", "experimental", "internal"]
    }],
    "jsdoc/check-types": "error",
    "jsdoc/no-undefined-types": "error",
    "jsdoc/valid-types": "error"
  }
}
```

## Coverage Analysis

### Coverage Report Format

```json
{
  "summary": {
    "documented": 145,
    "undocumented": 23,
    "total": 168,
    "percentage": 86.31
  },
  "byKind": {
    "class": { "documented": 12, "total": 14 },
    "interface": { "documented": 28, "total": 30 },
    "function": { "documented": 45, "total": 52 },
    "method": { "documented": 60, "total": 72 }
  },
  "undocumented": [
    {
      "name": "internalHelper",
      "kind": "function",
      "file": "src/utils/helpers.ts",
      "line": 42
    }
  ],
  "incomplete": [
    {
      "name": "processData",
      "kind": "function",
      "file": "src/core/processor.ts",
      "issues": ["missing @returns", "missing @param for 'options'"]
    }
  ]
}
```

## Workflow

1. **Analyze project** - Scan for TypeScript/JavaScript files
2. **Parse documentation** - Extract JSDoc/TSDoc comments
3. **Validate coverage** - Check against threshold
4. **Type alignment** - Verify docs match TypeScript types
5. **Generate documentation** - Run TypeDoc or JSDoc
6. **Create coverage report** - Output coverage analysis
7. **Lint validation** - Run ESLint documentation rules

## Dependencies

```json
{
  "devDependencies": {
    "typedoc": "^0.25.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "eslint-plugin-jsdoc": "^48.0.0",
    "@microsoft/tsdoc": "^0.14.0",
    "@microsoft/tsdoc-config": "^0.16.0"
  }
}
```

## Best Practices Applied

- TSDoc for TypeScript, JSDoc for JavaScript
- Always document public API surface
- Include @example for complex functions
- Use @remarks for implementation notes
- Link related symbols with @see
- Mark experimental features with @alpha/@beta
- Validate types match documentation

## References

- TypeDoc: https://typedoc.org/
- TSDoc: https://tsdoc.org/
- JSDoc: https://jsdoc.app/
- eslint-plugin-jsdoc: https://github.com/gajus/eslint-plugin-jsdoc

## Target Processes

- api-doc-generation.js
- sdk-doc-generation.js
- docs-audit.js
- docs-testing.js
