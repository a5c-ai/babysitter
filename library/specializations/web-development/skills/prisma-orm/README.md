# Prisma ORM Skill

Expert assistance for Prisma ORM schema design, migrations, relations, query optimization, and database integration patterns.

## Overview

This skill provides specialized guidance for Prisma ORM, covering schema design, migrations, query optimization, and database patterns. It helps create type-safe, efficient database integrations.

## When to Use

- Designing database schemas with Prisma
- Managing migrations and database versioning
- Optimizing query performance
- Implementing complex relations
- Setting up seeding and testing

## Quick Start

### Basic Setup

```json
{
  "database": "postgresql",
  "models": ["User", "Post"]
}
```

### Full Application

```json
{
  "database": "postgresql",
  "models": [
    { "name": "User", "fields": ["email", "name", "role"] },
    { "name": "Post", "fields": ["title", "content", "published"] }
  ],
  "features": ["migrations", "seeding", "edge"]
}
```

## Generated Structure

```
prisma/
├── schema.prisma       # Database schema
├── migrations/         # Migration history
└── seed.ts            # Seed script
lib/db/
├── prisma.ts          # Client singleton
└── queries/           # Query functions
```

## Features

### Schema Definition

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])

  @@index([authorId])
}
```

### Prisma Client Singleton

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Type-Safe Queries

```typescript
// Get user with posts
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: true },
});

// Create with relations
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
    author: { connect: { id: userId } },
  },
});
```

### Transactions

```typescript
// Sequential operations
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.post.create({ data: postData }),
]);

// Interactive transaction
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data });
  await tx.post.create({
    data: { ...postData, authorId: user.id },
  });
});
```

### Pagination

```typescript
// Offset pagination
const posts = await prisma.post.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// Cursor pagination
const posts = await prisma.post.findMany({
  take: 10,
  cursor: { id: lastPostId },
  skip: 1,
});
```

## Migration Commands

```bash
# Development migration
npx prisma migrate dev --name init

# Production deployment
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| database-schema-design | Schema creation |
| migration-management | Migration workflow |
| query-optimization | Performance patterns |
| data-seeding | Test data setup |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| database | postgresql | Database provider |
| logging | error | Query logging level |
| previewFeatures | [] | Preview features |

## Best Practices

1. **Relations**: Use proper foreign keys and cascades
2. **Indexes**: Add indexes for frequently queried fields
3. **Select**: Only fetch needed fields
4. **Batching**: Use transactions for multiple operations
5. **Types**: Leverage Prisma's generated types

## Common Patterns

### Soft Deletes

```prisma
model Post {
  id        String    @id
  deletedAt DateTime?
}
```

```typescript
const posts = await prisma.post.findMany({
  where: { deletedAt: null },
});
```

### Full-Text Search

```prisma
model Post {
  id      String @id
  title   String
  content String

  @@fulltext([title, content])
}
```

### JSON Fields

```prisma
model Settings {
  id   String @id
  data Json
}
```

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma MCP Server](https://www.prisma.io/mcp)
