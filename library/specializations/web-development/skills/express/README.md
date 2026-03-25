# Express Skill

Express.js API development with middleware patterns, routing, and security best practices.

## Overview

This skill provides expertise in Express.js, the most popular Node.js web framework for building REST APIs and web applications.

## When to Use

- Building REST APIs
- Creating middleware pipelines
- Implementing authentication
- Setting up API routes
- Error handling patterns

## Quick Start

```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/users', async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

app.listen(3000);
```

## Key Patterns

| Pattern | Description |
|---------|-------------|
| Middleware | Request/response pipeline |
| Router | Modular route handling |
| Controller | Business logic separation |
| Error Handler | Centralized error handling |

## Middleware Stack

```typescript
app.use(helmet());          // Security
app.use(cors());            // CORS
app.use(express.json());    // Parsing
app.use(morgan('dev'));     // Logging
app.use(errorHandler);      // Errors
```

## Integration

Works with prisma-skill and mongodb-skill for database operations.
