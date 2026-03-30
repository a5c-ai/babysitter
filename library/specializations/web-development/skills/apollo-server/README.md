# Apollo Server Skill

GraphQL server implementation with Apollo Server, featuring plugins, caching, and federation.

## Overview

This skill provides expertise in Apollo Server, the most popular GraphQL server for Node.js.

## When to Use

- Implementing GraphQL APIs
- Setting up Apollo Federation
- Adding GraphQL subscriptions
- Implementing caching strategies

## Quick Start

```typescript
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();
```

## Integration

Works with graphql-skill for schema design and express-skill/fastify-skill for HTTP server.
