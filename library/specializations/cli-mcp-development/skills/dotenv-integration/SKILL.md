---
name: dotenv-integration
description: Integrate dotenv for environment variable loading with validation and type coercion.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Dotenv Integration

Integrate dotenv for environment variable loading.

## Generated Patterns

```typescript
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

// Load .env files in order
for (const file of ['.env.local', `.env.${process.env.NODE_ENV}`, '.env']) {
  expand(config({ path: file }));
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

## Target Processes

- configuration-management-system
- mcp-server-bootstrap
- cli-application-bootstrap
