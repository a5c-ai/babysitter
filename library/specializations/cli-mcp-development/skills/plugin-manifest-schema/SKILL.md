---
name: plugin-manifest-schema
description: Define plugin manifest schema with versioning and dependency declarations.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Plugin Manifest Schema

Define plugin manifest schema.

## Generated Patterns

```typescript
import { z } from 'zod';

export const pluginManifestSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  description: z.string(),
  main: z.string().default('index.js'),
  author: z.string().optional(),
  license: z.string().optional(),
  engines: z.object({
    app: z.string().optional(),
    node: z.string().optional(),
  }).optional(),
  dependencies: z.record(z.string()).optional(),
  hooks: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;
```

## Target Processes

- plugin-architecture-implementation
