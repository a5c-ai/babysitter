---
name: cosmiconfig-setup
description: Set up cosmiconfig for hierarchical configuration loading from multiple sources and formats.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Cosmiconfig Setup

Set up cosmiconfig for hierarchical config loading.

## Capabilities

- Configure cosmiconfig search paths
- Set up format loaders (JSON, YAML, TOML)
- Create TypeScript config support
- Implement config caching
- Handle config validation

## Generated Patterns

```typescript
import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';

const moduleName = 'myapp';

const explorer = cosmiconfig(moduleName, {
  searchPlaces: [
    'package.json',
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.ts`,
    `.${moduleName}rc.cjs`,
    `${moduleName}.config.js`,
    `${moduleName}.config.ts`,
    `${moduleName}.config.cjs`,
  ],
  loaders: {
    '.ts': TypeScriptLoader(),
  },
});

export async function loadConfig(searchFrom?: string) {
  const result = await explorer.search(searchFrom);
  if (!result || result.isEmpty) {
    return { config: getDefaultConfig(), filepath: null };
  }
  return { config: { ...getDefaultConfig(), ...result.config }, filepath: result.filepath };
}
```

## Target Processes

- configuration-management-system
- cli-application-bootstrap
- mcp-server-bootstrap
