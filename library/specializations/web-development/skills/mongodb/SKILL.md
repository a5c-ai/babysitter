---
name: mongodb
description: MongoDB schema design, aggregation pipelines, indexing strategies, and performance.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MongoDB Skill

Expert assistance for MongoDB database design and operations.

## Capabilities

- Design document schemas
- Build aggregation pipelines
- Create optimal indexes
- Implement data modeling patterns
- Configure replication and sharding

## Aggregation Pipeline

```typescript
const results = await collection.aggregate([
  { $match: { status: 'active' } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
  { $limit: 10 },
]).toArray();
```

## Indexing

```typescript
// Compound index
await collection.createIndex({ userId: 1, createdAt: -1 });

// Text index
await collection.createIndex({ title: 'text', content: 'text' });
```

## Target Processes

- mern-stack-development
- database-design
- backend-development
