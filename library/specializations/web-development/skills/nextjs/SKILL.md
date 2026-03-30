---
name: nextjs
description: Next.js specific patterns including App Router, React Server Components, Server Actions, streaming, caching, and Vercel deployment.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Next.js Skill

Expert assistance for building full-stack Next.js applications with App Router, React Server Components, Server Actions, and modern deployment patterns.

## Capabilities

- Generate Next.js project structure with App Router
- Implement React Server Components (RSC) patterns
- Create Server Actions for form handling and mutations
- Configure advanced routing (parallel, intercepting, route groups)
- Set up streaming with Suspense boundaries
- Implement caching strategies with revalidation
- Configure Vercel deployment and edge functions

## Usage

Invoke this skill when you need to:
- Bootstrap a new Next.js 15+ application
- Implement server-side rendering and data fetching
- Create API routes and Server Actions
- Configure advanced routing patterns
- Optimize for Core Web Vitals

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the Next.js project |
| router | string | No | app (default) or pages |
| features | array | No | List of features to scaffold |
| database | string | No | prisma, drizzle, none |
| auth | string | No | nextauth, clerk, none |
| styling | string | No | tailwind, css-modules, styled-components |

### Feature Configuration

```json
{
  "projectName": "my-saas",
  "features": [
    "authentication",
    "api-routes",
    "server-actions",
    "parallel-routes",
    "middleware"
  ],
  "database": "prisma",
  "auth": "nextauth",
  "styling": "tailwind"
}
```

## Output Structure

```
my-saas/
├── app/
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page
│   ├── loading.tsx                  # Loading UI
│   ├── error.tsx                    # Error boundary
│   ├── not-found.tsx               # 404 page
│   ├── globals.css                  # Global styles
│   ├── (auth)/                      # Route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout
│   │   ├── page.tsx
│   │   ├── @sidebar/               # Parallel route
│   │   │   └── default.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       └── [...route]/
│           └── route.ts            # API routes
├── components/
│   ├── ui/                         # Reusable UI components
│   └── features/                   # Feature-specific components
├── lib/
│   ├── actions/                    # Server Actions
│   │   └── user-actions.ts
│   ├── db/                         # Database utilities
│   │   └── prisma.ts
│   └── utils/                      # Utility functions
├── middleware.ts                   # Edge middleware
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind configuration
└── package.json
```

## Generated Code Patterns

### App Router Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'My SaaS',
    template: '%s | My SaaS',
  },
  description: 'A modern SaaS application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### React Server Component

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getUser } from '@/lib/db/user';
import { DashboardStats } from '@/components/features/dashboard-stats';
import { DashboardSkeleton } from '@/components/ui/skeletons';

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats userId={user.id} />
      </Suspense>
    </main>
  );
}
```

### Server Action

```typescript
// lib/actions/user-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function updateProfile(formData: FormData) {
  const validatedFields = updateProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email } = validatedFields.data;

  try {
    await prisma.user.update({
      where: { id: getCurrentUserId() },
      data: { name, email },
    });
  } catch (error) {
    return { error: 'Failed to update profile' };
  }

  revalidatePath('/dashboard/settings');
  redirect('/dashboard');
}
```

### Form with Server Action

```typescript
// app/dashboard/settings/page.tsx
import { updateProfile } from '@/lib/actions/user-actions';
import { SubmitButton } from '@/components/ui/submit-button';

export default function SettingsPage() {
  return (
    <form action={updateProfile} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <SubmitButton>Update Profile</SubmitButton>
    </form>
  );
}
```

### Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

### API Route Handler

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '10');

  const users = await prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json({ users, page, limit });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const user = await prisma.user.create({
    data: body,
  });

  return NextResponse.json(user, { status: 201 });
}
```

## Caching Strategies

### Static Generation with Revalidation

```typescript
// Revalidate every hour
export const revalidate = 3600;

export default async function Page() {
  const data = await fetchData();
  return <div>{/* content */}</div>;
}
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { path, tag, secret } = await request.json();

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (tag) {
    revalidateTag(tag);
  } else if (path) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true });
}
```

## Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

## Workflow

1. **Create project structure** - Set up App Router directories
2. **Configure layouts** - Root and nested layouts
3. **Implement pages** - Server and client components
4. **Add Server Actions** - Form handling and mutations
5. **Configure middleware** - Auth and security
6. **Set up API routes** - REST or tRPC endpoints
7. **Optimize caching** - Static and dynamic strategies
8. **Deploy to Vercel** - Edge and serverless configuration

## Best Practices Applied

- App Router with React Server Components
- TypeScript strict mode
- Server Actions for mutations
- Proper loading and error states
- Image optimization with next/image
- Font optimization with next/font
- Metadata API for SEO
- Edge-compatible code

## References

- Next.js Documentation: https://nextjs.org/docs
- Next.js DevTools MCP: https://github.com/vercel/next-devtools-mcp
- claude-code-nextjs-skills: https://github.com/laguagu/claude-code-nextjs-skills
- Vercel Deployment: https://vercel.com/docs

## Target Processes

- nextjs-full-stack-development
- server-component-architecture
- api-route-implementation
- authentication-setup
- deployment-optimization
