---
name: trpc
description: tRPC end-to-end type safety, procedures, routers, middleware, and React integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# tRPC Skill

Expert assistance for building type-safe APIs with tRPC.

## Capabilities

- Create type-safe procedures and routers
- Implement middleware for auth/validation
- Set up tRPC with Next.js/React
- Handle subscriptions
- Configure error handling
- Build type-safe client hooks

## Usage

Invoke this skill when you need to:
- Build end-to-end type-safe APIs
- Integrate with React/Next.js
- Replace REST with type-safe RPC
- Implement real-time features

## Patterns

### Router Definition

```typescript
// server/trpc/routers/user.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: input.search
          ? { name: { contains: input.search } }
          : undefined,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });
      return users;
    }),

  byId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
      });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return user;
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.create({ data: input });
    }),
});
```

### React Integration

```typescript
// In component
const { data, isLoading } = trpc.user.list.useQuery({ page: 1 });
const createUser = trpc.user.create.useMutation();

<button onClick={() => createUser.mutate({ name, email })}>
  Create
</button>
```

## Best Practices

- Use Zod for input validation
- Implement proper middleware
- Leverage type inference
- Handle errors consistently

## Target Processes

- t3-stack-development
- nextjs-full-stack
- type-safe-api
