# Drizzle Skill

Type-safe SQL ORM with excellent TypeScript support and performance.

## Overview

Drizzle ORM provides a lightweight, type-safe way to interact with SQL databases.

## When to Use

- Type-safe database queries
- SQL-first approach preferred
- Lightweight ORM needed
- Multiple database support

## Quick Start

```typescript
const users = await db.select().from(usersTable).where(eq(usersTable.id, 1));
```

## Integration

Works with postgresql-skill and nextjs-skill.
