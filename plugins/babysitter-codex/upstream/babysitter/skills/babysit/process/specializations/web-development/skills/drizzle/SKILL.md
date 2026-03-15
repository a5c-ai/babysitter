---
name: drizzle
description: Drizzle ORM patterns, migrations, type-safe queries, and database schema design.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Drizzle Skill

Expert assistance for database operations with Drizzle ORM.

## Capabilities

- Define type-safe database schemas
- Write performant SQL queries
- Handle migrations
- Implement relations
- Configure multiple database dialects

## Schema Definition

```typescript
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  authorId: uuid('author_id').references(() => users.id),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

## Queries

```typescript
// Select with relations
const result = await db.query.users.findMany({
  with: { posts: true },
  where: eq(users.name, 'John'),
});

// Insert
await db.insert(users).values({ name: 'John', email: 'john@example.com' });

// Update
await db.update(users).set({ name: 'Jane' }).where(eq(users.id, id));
```

## Target Processes

- database-setup
- backend-development
- nextjs-full-stack
