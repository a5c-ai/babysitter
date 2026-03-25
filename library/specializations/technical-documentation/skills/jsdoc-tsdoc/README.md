# JSDoc/TSDoc Skill

Generate comprehensive API documentation for JavaScript and TypeScript projects using industry-standard documentation conventions.

## Overview

This skill provides deep expertise in JSDoc (JavaScript) and TSDoc (TypeScript) documentation standards. It integrates with TypeDoc for automated documentation generation, supports coverage analysis, and enforces documentation quality through linting.

## When to Use

- Documenting JavaScript/TypeScript libraries
- Generating API reference documentation
- Auditing documentation coverage
- Setting up CI/CD documentation pipelines
- Enforcing documentation standards

## Quick Start

### Basic Documentation Generation

```json
{
  "projectPath": "./packages/sdk",
  "outputFormat": "html"
}
```

### With Coverage Requirements

```json
{
  "projectPath": "./packages/sdk",
  "entryPoints": ["src/index.ts"],
  "outputDir": "docs/api",
  "coverageThreshold": 80,
  "customTags": ["@internal", "@experimental"]
}
```

## Generated Output

```
docs/api/
├── index.html           # Documentation home page
├── modules.html         # Module listing
├── classes/             # Class documentation
├── interfaces/          # Interface documentation
├── functions/           # Function documentation
├── types/               # Type alias documentation
└── coverage.json        # Coverage analysis report
```

## Documentation Patterns

### TypeScript Function

```typescript
/**
 * Fetches user data from the API.
 *
 * @param userId - The unique user identifier
 * @param options - Optional request configuration
 * @returns The user data or null if not found
 *
 * @example
 * ```typescript
 * const user = await getUser('123');
 * console.log(user.name);
 * ```
 *
 * @throws {NotFoundError} When user doesn't exist
 * @public
 */
export async function getUser(
  userId: string,
  options?: RequestOptions
): Promise<User | null> {
  // Implementation
}
```

### TypeScript Interface

```typescript
/**
 * Configuration for the API client.
 *
 * @remarks
 * All durations are in milliseconds unless otherwise noted.
 *
 * @public
 */
export interface ClientConfig {
  /** Base URL for API requests */
  baseUrl: string;

  /** Request timeout in milliseconds @defaultValue 30000 */
  timeout?: number;

  /** Custom headers for all requests */
  headers?: Record<string, string>;
}
```

### JavaScript Class

```javascript
/**
 * Manages database connections with pooling.
 *
 * @class
 * @example
 * const pool = new ConnectionPool({
 *   host: 'localhost',
 *   maxConnections: 10
 * });
 * const conn = await pool.acquire();
 */
class ConnectionPool {
  /**
   * Creates a new connection pool.
   *
   * @param {PoolOptions} options - Pool configuration
   * @param {string} options.host - Database host
   * @param {number} [options.maxConnections=5] - Maximum connections
   */
  constructor(options) {
    // Implementation
  }

  /**
   * Acquires a connection from the pool.
   *
   * @returns {Promise<Connection>} A database connection
   * @throws {PoolExhaustedError} When no connections available
   */
  async acquire() {
    // Implementation
  }
}
```

## TypeDoc Configuration

### typedoc.json

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "name": "SDK Documentation",
  "readme": "README.md",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeInternal": true,
  "plugin": ["typedoc-plugin-markdown"],
  "validation": {
    "notExported": true,
    "invalidLink": true
  }
}
```

### Running TypeDoc

```bash
# Generate HTML documentation
npx typedoc

# Generate Markdown documentation
npx typedoc --plugin typedoc-plugin-markdown --out docs/md

# Watch mode for development
npx typedoc --watch
```

## ESLint Integration

### .eslintrc.json

```json
{
  "plugins": ["jsdoc"],
  "extends": ["plugin:jsdoc/recommended-typescript"],
  "rules": {
    "jsdoc/require-jsdoc": ["warn", {
      "publicOnly": true,
      "require": {
        "FunctionDeclaration": true,
        "ClassDeclaration": true,
        "MethodDefinition": true
      }
    }],
    "jsdoc/require-description": "warn",
    "jsdoc/require-param-description": "warn",
    "jsdoc/check-tag-names": ["error", {
      "definedTags": ["internal", "experimental", "alpha", "beta"]
    }]
  }
}
```

## Coverage Analysis

### Running Coverage Check

```bash
# Using TypeDoc coverage
npx typedoc --validation.notDocumented --logLevel Verbose

# Custom coverage script
node scripts/doc-coverage.js --threshold 80
```

### Coverage Report

```json
{
  "summary": {
    "documented": 145,
    "undocumented": 23,
    "percentage": 86.31
  },
  "undocumented": [
    {
      "name": "privateHelper",
      "file": "src/utils.ts",
      "line": 42
    }
  ]
}
```

## Common Tags Reference

### TSDoc Tags

| Tag | Description |
|-----|-------------|
| `@param` | Parameter description |
| `@returns` | Return value description |
| `@throws` | Exception documentation |
| `@example` | Usage example |
| `@remarks` | Additional notes |
| `@see` | Cross-references |
| `@public` | Public API marker |
| `@internal` | Internal implementation |
| `@alpha` | Alpha feature |
| `@beta` | Beta feature |
| `@deprecated` | Deprecation notice |
| `@defaultValue` | Default parameter value |

### JSDoc Tags

| Tag | Description |
|-----|-------------|
| `@param {Type}` | Typed parameter |
| `@returns {Type}` | Typed return value |
| `@type {Type}` | Variable type |
| `@typedef` | Type definition |
| `@callback` | Callback type |
| `@class` | Class marker |
| `@extends` | Inheritance |
| `@implements` | Interface implementation |
| `@fires` | Event documentation |
| `@listens` | Event listener |

## Process Integration

| Process | Usage |
|---------|-------|
| `api-doc-generation.js` | Generate API reference docs |
| `sdk-doc-generation.js` | SDK documentation |
| `docs-audit.js` | Coverage analysis |
| `docs-testing.js` | Documentation validation |

## CI/CD Integration

### GitHub Actions

```yaml
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Check documentation coverage
        run: npm run docs:coverage -- --threshold 80

      - name: Build documentation
        run: npm run docs:build

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/api
```

## References

- [TypeDoc Documentation](https://typedoc.org/)
- [TSDoc Specification](https://tsdoc.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc)
- [TypeDoc Plugins](https://typedoc.org/guides/plugins/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-014
**Category:** Code Documentation
**Status:** Active
