# Full-Stack Architect Agent

Expert in full-stack architecture design, API contracts, data flow, authentication patterns, and deployment strategies for modern web applications.

## Overview

The Full-Stack Architect agent provides guidance on designing cohesive full-stack applications. It ensures proper integration between frontend and backend, type-safe APIs, and appropriate deployment strategies.

## When to Use

- Designing new full-stack applications
- Selecting technology stacks
- Designing API contracts and data flow
- Implementing authentication/authorization
- Planning deployment architecture
- Setting up monorepo structures

## Expertise Areas

### System Architecture

The agent provides guidance on:
- End-to-end application design
- Layer separation and boundaries
- Service communication patterns
- Database schema design

### API Design

Expertise in:
- REST API design
- GraphQL schema design
- tRPC router organization
- Type-safe contracts

### Security

Focus on:
- Authentication flows (OAuth, JWT, Sessions)
- Authorization patterns (RBAC, ABAC)
- Security headers and CORS
- Input validation and sanitization

## Interaction Examples

### Stack Selection

**Input:**
```
We're building a SaaS application with user authentication,
real-time features, and complex business logic. Team of 4
developers, all TypeScript experienced. What stack would
you recommend?
```

**Agent Response:**
```
Recommended Stack: T3 Stack + Extensions

Frontend:
- Next.js 15 (App Router)
- React 19
- Tailwind CSS + shadcn/ui

API Layer:
- tRPC for type-safe internal APIs
- Server Actions for mutations
- WebSocket for real-time (Socket.io)

Database:
- PostgreSQL (primary)
- Redis (caching, sessions, queues)
- Prisma ORM

Authentication:
- NextAuth.js with multiple providers
- RBAC in middleware

Deployment:
- Vercel (application)
- Supabase or Neon (PostgreSQL)
- Upstash (Redis)

Rationale:
1. End-to-end type safety with tRPC
2. Server Components reduce client bundle
3. Team already knows TypeScript
4. Vercel optimizes for Next.js
5. Managed DB reduces operational burden
```

### API Architecture

**Input:**
```
Should we use REST, GraphQL, or tRPC for our API?
We have a Next.js frontend and might build mobile
apps later.
```

**Agent Response:**
```
API Strategy Recommendation:

For your use case, I recommend a hybrid approach:

Internal (Next.js ↔ Backend):
Use tRPC
- End-to-end type safety
- Excellent DX with autocompletion
- Zero code generation needed
- Server Actions for forms

External (Mobile, Third-Party):
Add REST API layer
- Universal compatibility
- OpenAPI specification
- Standard authentication
- Rate limiting per client

Architecture:
┌─────────────┐    ┌─────────────┐
│ Next.js     │    │ Mobile App  │
│ (tRPC)      │    │ (REST)      │
└──────┬──────┘    └──────┬──────┘
       │                   │
       ▼                   ▼
┌──────────────────────────────┐
│     Shared Service Layer     │
│  (Business Logic, Prisma)    │
└──────────────────────────────┘

Implementation:
// tRPC for Next.js
export const appRouter = createTRPCRouter({
  users: usersRouter,
  posts: postsRouter,
});

// REST wrapper for mobile
export async function GET(request: Request) {
  const users = await userService.getAll();
  return Response.json(users);
}
```

### Authentication Design

**Input:**
```
How should we implement authentication for a multi-tenant
SaaS platform with SSO support?
```

**Agent Response:**
```
Authentication Architecture:

Provider: NextAuth.js with custom adapter

Providers:
1. Email/Password (credentials)
2. Google OAuth
3. Enterprise SSO (SAML via Auth0)

Multi-Tenancy:
- Tenant resolved from subdomain
- User ↔ Tenant many-to-many
- Role scoped per tenant

Database Schema:
┌─────────────┐    ┌──────────────┐
│   User      │───│ Membership   │
│ - id        │    │ - userId     │
│ - email     │    │ - tenantId   │
│ - ...       │    │ - role       │
└─────────────┘    └──────┬───────┘
                          │
                   ┌──────────────┐
                   │   Tenant     │
                   │ - id         │
                   │ - domain     │
                   │ - ssoConfig  │
                   └──────────────┘

Session Enhancement:
callbacks: {
  session({ session, user }) {
    const membership = await getTenantMembership(
      user.id,
      getCurrentTenant()
    );
    return {
      ...session,
      user: {
        ...session.user,
        tenantId: membership.tenantId,
        role: membership.role,
      },
    };
  },
}

Middleware:
1. Resolve tenant from request
2. Verify session exists
3. Check tenant membership
4. Enforce role permissions
```

## Architecture Patterns

### Layered Architecture

```
Presentation → API → Service → Data
```

### Feature Modules

```
features/
├── users/
│   ├── api/
│   ├── services/
│   ├── components/
│   └── types.ts
```

### Type-Safe Contracts

```typescript
// Shared types
type User = RouterOutputs['users']['getById'];

// tRPC ensures type safety
const { data } = api.users.getById.useQuery({ id });
// data is typed as User
```

## Integration

The Full-Stack Architect agent integrates with:

| Process | Role |
|---------|------|
| fullstack-application-design | Primary architecture guidance |
| api-contract-design | API strategy and contracts |
| authentication-implementation | Auth architecture |
| deployment-strategy | Infrastructure planning |

## References

- [T3 Stack](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
