# tRPC Skill

End-to-end type-safe APIs without code generation.

## Overview

This skill provides expertise in tRPC, enabling fully type-safe APIs between client and server.

## When to Use

- Full-stack TypeScript projects
- Next.js applications
- Need end-to-end type safety
- Replacing REST APIs

## Quick Start

```typescript
// Server
export const appRouter = router({
  hello: publicProcedure
    .input(z.string())
    .query(({ input }) => `Hello ${input}`),
});

// Client
const { data } = trpc.hello.useQuery('World');
```

## Integration

Core component of T3 Stack with Next.js and Prisma.
