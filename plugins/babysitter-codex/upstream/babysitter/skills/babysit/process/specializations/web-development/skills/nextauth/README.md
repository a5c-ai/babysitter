# NextAuth Skill

Authentication for Next.js applications with NextAuth.js (Auth.js).

## Overview

This skill provides expertise in NextAuth.js, the most popular authentication solution for Next.js, supporting OAuth providers, credentials, and database sessions.

## When to Use

- Adding authentication to Next.js apps
- Configuring OAuth providers
- Implementing credentials authentication
- Setting up protected routes
- Managing user sessions

## Quick Start

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});

export { handler as GET, handler as POST };
```

## Supported Providers

| Provider | Type |
|----------|------|
| Google | OAuth |
| GitHub | OAuth |
| Discord | OAuth |
| Credentials | Email/Password |
| Email | Magic Link |

## Key Components

- **Providers**: OAuth and credentials configuration
- **Adapters**: Database integration (Prisma, Drizzle)
- **Callbacks**: Customize JWT/session handling
- **Middleware**: Route protection

## Integration

Works with nextjs-skill and prisma-skill for complete full-stack authentication.
