---
name: apollo-server
description: Apollo Server configuration, plugins, caching, federation, and performance optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Apollo Server Skill

Expert assistance for implementing GraphQL APIs with Apollo Server.

## Capabilities

- Configure Apollo Server with Express/Fastify
- Implement plugins for logging and metrics
- Set up caching strategies
- Build Apollo Federation gateways
- Handle authentication context
- Optimize performance with persisted queries

## Usage

Invoke this skill when you need to:
- Set up Apollo Server
- Implement caching
- Build federated services
- Add custom plugins
- Configure subscriptions

## Patterns

### Basic Setup

```typescript
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  console.log('Server ready at http://localhost:4000/graphql');
}
```

### Context and Authentication

```typescript
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  user: { id: string; role: string } | null;
}

export async function createContext({ req }): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  let user = null;

  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET!) as Context['user'];
    } catch {}
  }

  return { prisma, user };
}
```

## Best Practices

- Use plugins for cross-cutting concerns
- Implement proper error formatting
- Set up response caching
- Use DataLoader for batching

## Target Processes

- graphql-api-development
- apollo-federation
- api-development
