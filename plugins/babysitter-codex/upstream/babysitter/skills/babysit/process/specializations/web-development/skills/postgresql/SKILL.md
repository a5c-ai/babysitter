---
name: postgresql
description: PostgreSQL query optimization, indexing, full-text search, JSONB, and advanced features.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# PostgreSQL Skill

Expert assistance for PostgreSQL database design and optimization.

## Capabilities

- Design optimal schemas
- Create performant indexes
- Implement full-text search
- Work with JSONB data
- Optimize query performance
- Configure replication

## Indexing Patterns

```sql
-- B-tree for equality and range
CREATE INDEX idx_users_email ON users(email);

-- GIN for JSONB and arrays
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Full-text search
CREATE INDEX idx_posts_search ON posts USING GIN(to_tsvector('english', title || ' ' || content));

-- Partial index
CREATE INDEX idx_active_users ON users(created_at) WHERE active = true;
```

## JSONB Operations

```sql
-- Query JSONB
SELECT * FROM users WHERE metadata->>'role' = 'admin';

-- Update JSONB
UPDATE users SET metadata = metadata || '{"verified": true}'::jsonb WHERE id = 1;
```

## Target Processes

- database-design
- performance-optimization
- backend-development
