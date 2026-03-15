# Fastify Skill

High-performance Node.js web framework with schema-based validation and plugin architecture.

## Overview

This skill provides expertise in Fastify, one of the fastest web frameworks for Node.js, featuring JSON Schema validation, plugin system, and TypeScript support.

## When to Use

- Building high-performance APIs
- Need schema-based validation
- Creating plugin-based architecture
- Performance-critical applications
- TypeScript projects

## Quick Start

```typescript
import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/users', {
  schema: {
    response: {
      200: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } }
      }
    }
  }
}, async () => {
  return [{ name: 'John' }];
});

app.listen({ port: 3000 });
```

## Key Features

| Feature | Description |
|---------|-------------|
| Speed | Low overhead, high throughput |
| Schema | JSON Schema validation |
| Plugins | Encapsulated extensions |
| TypeScript | Full type support |

## Schema Validation

```typescript
const schema = {
  body: Type.Object({
    name: Type.String(),
    email: Type.String({ format: 'email' })
  })
};
```

## Integration

Works with prisma-skill and other database skills for data persistence.
