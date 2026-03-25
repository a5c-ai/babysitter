---
name: config-migration-generator
description: Generate configuration file migration utilities for version upgrades.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Config Migration Generator

Generate config file migration utilities.

## Generated Patterns

```typescript
interface Migration {
  version: string;
  up: (config: any) => any;
  down: (config: any) => any;
}

const migrations: Migration[] = [
  {
    version: '2.0.0',
    up: (config) => ({
      ...config,
      server: { host: config.host, port: config.port },
      version: '2.0.0',
    }),
    down: (config) => ({
      host: config.server?.host,
      port: config.server?.port,
      version: '1.0.0',
    }),
  },
];

export function migrateConfig(config: any, targetVersion: string): any {
  let current = config;
  for (const migration of migrations) {
    if (semver.gt(migration.version, config.version) && semver.lte(migration.version, targetVersion)) {
      current = migration.up(current);
    }
  }
  return current;
}
```

## Target Processes

- configuration-management-system
- cli-update-mechanism
