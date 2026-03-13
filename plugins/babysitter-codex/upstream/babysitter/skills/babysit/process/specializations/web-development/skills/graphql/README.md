# GraphQL Skill

GraphQL API design and implementation with schema-first approach and best practices.

## Overview

This skill provides expertise in GraphQL, a query language for APIs that provides a complete description of data and enables clients to request exactly what they need.

## When to Use

- Building flexible APIs
- Complex data relationships
- Real-time subscriptions
- Mobile applications
- Microservices aggregation

## Quick Start

```graphql
type Query {
  user(id: ID!): User
  users: [User!]!
}

type User {
  id: ID!
  name: String!
  posts: [Post!]!
}
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| Schema | Type definitions |
| Queries | Read operations |
| Mutations | Write operations |
| Subscriptions | Real-time updates |
| Resolvers | Data fetching logic |

## Schema Design

```graphql
input CreateUserInput {
  name: String!
  email: String!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}
```

## Integration

Works with apollo-server-skill for implementation and prisma-skill for database.
