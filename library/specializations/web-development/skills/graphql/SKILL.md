---
name: graphql
description: GraphQL schema design, resolvers, directives, subscriptions, and best practices for API development.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# GraphQL Skill

Expert assistance for designing and implementing GraphQL APIs.

## Capabilities

- Design GraphQL schemas with SDL
- Implement resolvers and data loaders
- Create custom directives
- Set up subscriptions for real-time
- Handle authentication and authorization
- Optimize query performance

## Usage

Invoke this skill when you need to:
- Design GraphQL API schemas
- Implement resolvers
- Add real-time subscriptions
- Create custom directives
- Optimize N+1 queries

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| typeName | string | Yes | GraphQL type name |
| operations | array | No | queries, mutations, subscriptions |
| directives | array | No | Custom directives |

## Schema Design Patterns

### Type Definitions

```graphql
# schema.graphql

# Scalars
scalar DateTime
scalar JSON

# Enums
enum Role {
  USER
  ADMIN
}

enum SortOrder {
  ASC
  DESC
}

# Types
type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
  posts: [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: DateTime!
}

# Pagination
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type UserEdge {
  node: User!
  cursor: String!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

# Inputs
input CreateUserInput {
  name: String!
  email: String!
  password: String!
  role: Role = USER
}

input UpdateUserInput {
  name: String
  email: String
  role: Role
}

input UsersFilterInput {
  search: String
  role: Role
}

input PaginationInput {
  first: Int
  after: String
  last: Int
  before: String
}

# Queries
type Query {
  me: User
  user(id: ID!): User
  users(
    filter: UsersFilterInput
    pagination: PaginationInput
    orderBy: SortOrder
  ): UserConnection!
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
}

# Mutations
type Mutation {
  # Auth
  login(email: String!, password: String!): AuthPayload!
  register(input: CreateUserInput!): AuthPayload!

  # Users
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!

  # Posts
  createPost(title: String!, content: String!): Post!
  updatePost(id: ID!, title: String, content: String, published: Boolean): Post!
  deletePost(id: ID!): Boolean!
}

# Subscriptions
type Subscription {
  postCreated: Post!
  postUpdated(id: ID!): Post!
  commentAdded(postId: ID!): Comment!
}

# Auth
type AuthPayload {
  token: String!
  user: User!
}

# Directives
directive @auth(requires: Role = USER) on FIELD_DEFINITION
directive @deprecated(reason: String) on FIELD_DEFINITION
```

### Resolvers

```typescript
// resolvers/index.ts
import { Resolvers } from '../generated/graphql';
import { Context } from '../context';
import { userResolvers } from './user.resolvers';
import { postResolvers } from './post.resolvers';
import { authResolvers } from './auth.resolvers';

export const resolvers: Resolvers<Context> = {
  Query: {
    ...userResolvers.Query,
    ...postResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
  },
  Subscription: {
    ...postResolvers.Subscription,
  },
  User: userResolvers.User,
  Post: postResolvers.Post,
};

// resolvers/user.resolvers.ts
import { GraphQLError } from 'graphql';
import { Context } from '../context';

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, { user, prisma }: Context) => {
      if (!user) throw new GraphQLError('Not authenticated');
      return prisma.user.findUnique({ where: { id: user.id } });
    },

    user: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      return prisma.user.findUnique({ where: { id } });
    },

    users: async (
      _: unknown,
      { filter, pagination, orderBy }: any,
      { prisma }: Context
    ) => {
      const { first = 10, after } = pagination || {};

      const where = filter?.search
        ? { name: { contains: filter.search, mode: 'insensitive' } }
        : undefined;

      const users = await prisma.user.findMany({
        where,
        take: first + 1,
        cursor: after ? { id: after } : undefined,
        skip: after ? 1 : 0,
        orderBy: { name: orderBy || 'asc' },
      });

      const hasNextPage = users.length > first;
      const edges = users.slice(0, first).map((user) => ({
        node: user,
        cursor: user.id,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: await prisma.user.count({ where }),
      };
    },
  },

  Mutation: {
    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: any },
      { user, prisma }: Context
    ) => {
      if (!user) throw new GraphQLError('Not authenticated');
      if (user.id !== id && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized');
      }

      return prisma.user.update({
        where: { id },
        data: input,
      });
    },
  },

  User: {
    posts: async (parent: any, _: unknown, { prisma }: Context) => {
      return prisma.post.findMany({ where: { authorId: parent.id } });
    },
  },
};
```

### DataLoader for N+1

```typescript
// loaders/index.ts
import DataLoader from 'dataloader';
import { PrismaClient, User, Post } from '@prisma/client';

export function createLoaders(prisma: PrismaClient) {
  return {
    userLoader: new DataLoader<string, User | null>(async (ids) => {
      const users = await prisma.user.findMany({
        where: { id: { in: ids as string[] } },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id) || null);
    }),

    postsByAuthorLoader: new DataLoader<string, Post[]>(async (authorIds) => {
      const posts = await prisma.post.findMany({
        where: { authorId: { in: authorIds as string[] } },
      });
      const postsByAuthor = new Map<string, Post[]>();
      posts.forEach((post) => {
        const authorPosts = postsByAuthor.get(post.authorId) || [];
        authorPosts.push(post);
        postsByAuthor.set(post.authorId, authorPosts);
      });
      return authorIds.map((id) => postsByAuthor.get(id) || []);
    }),
  };
}

// Usage in resolver
User: {
  posts: (parent, _, { loaders }) => loaders.postsByAuthorLoader.load(parent.id),
}
```

## Best Practices

- Use input types for mutations
- Implement cursor-based pagination
- Use DataLoader for N+1 prevention
- Add proper error handling
- Document schema with descriptions

## Target Processes

- graphql-api-development
- api-design
- backend-development
- real-time-applications
