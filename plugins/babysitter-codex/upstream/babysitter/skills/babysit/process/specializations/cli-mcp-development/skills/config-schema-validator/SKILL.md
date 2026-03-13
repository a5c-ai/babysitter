---
name: config-schema-validator
description: Generate Zod/JSON Schema configuration validators with defaults and error messages.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Config Schema Validator

Generate configuration schema validators.

## Generated Patterns

```typescript
import { z } from 'zod';

export const configSchema = z.object({
  server: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(3000),
    cors: z.object({
      origins: z.array(z.string().url()).default(['*']),
      credentials: z.boolean().default(false),
    }).default({}),
  }).default({}),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'pretty']).default('pretty'),
  }).default({}),
}).strict();

export type Config = z.infer<typeof configSchema>;

export function validateConfig(input: unknown): Config {
  return configSchema.parse(input);
}

export function getConfigWithDefaults(partial: Partial<Config> = {}): Config {
  return configSchema.parse(partial);
}
```

## Target Processes

- configuration-management-system
- mcp-tool-implementation
- cli-application-bootstrap
