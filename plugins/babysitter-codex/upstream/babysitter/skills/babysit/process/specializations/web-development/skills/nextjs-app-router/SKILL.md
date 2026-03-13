---
name: nextjs-app-router
description: Deep expertise in Next.js App Router patterns including route groups, parallel routes, intercepting routes, layouts, and loading states.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Next.js App Router Skill

Expert assistance for implementing Next.js App Router with advanced routing patterns and conventions.

## Capabilities

- Design app directory structure with route groups
- Implement parallel and intercepting routes
- Configure layouts, templates, and loading states
- Set up error boundaries and not-found pages
- Implement streaming with Suspense
- Configure route handlers for API endpoints

## Usage

Invoke this skill when you need to:
- Structure app directory for complex routing
- Implement modal routes with interception
- Create parallel route layouts
- Configure streaming and loading states
- Build API route handlers

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| routeType | string | Yes | page, layout, route, loading, error |
| routePath | string | Yes | Route path in app directory |
| features | array | No | parallel, intercept, group |
| streaming | boolean | No | Enable streaming with Suspense |

### Configuration Example

```json
{
  "routeType": "page",
  "routePath": "/dashboard/analytics",
  "features": ["parallel", "loading"],
  "streaming": true
}
```

## Route Structure Patterns

### Route Groups

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx          # Auth-specific layout
├── (dashboard)/
│   ├── analytics/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── layout.tsx          # Dashboard layout with sidebar
├── (marketing)/
│   ├── about/
│   │   └── page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   └── layout.tsx          # Marketing layout
└── layout.tsx              # Root layout
```

### Parallel Routes

```
app/
├── @modal/
│   ├── (.)photos/[id]/
│   │   └── page.tsx        # Modal view
│   └── default.tsx
├── @sidebar/
│   ├── default.tsx
│   └── feed/
│       └── page.tsx
├── photos/
│   └── [id]/
│       └── page.tsx        # Full page view
├── layout.tsx
└── page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  modal,
  sidebar,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <div className="flex">
          <aside>{sidebar}</aside>
          <main>{children}</main>
        </div>
        {modal}
      </body>
    </html>
  );
}
```

### Intercepting Routes

```
app/
├── @modal/
│   └── (.)photos/[id]/     # Intercept from same level
│       └── page.tsx
├── feed/
│   └── @modal/
│       └── (..)photos/[id]/ # Intercept from parent
│           └── page.tsx
└── photos/
    └── [id]/
        └── page.tsx
```

```typescript
// app/@modal/(.)photos/[id]/page.tsx
import { Modal } from '@/components/modal';
import Photo from '@/components/photo';

export default function PhotoModal({
  params: { id },
}: {
  params: { id: string };
}) {
  return (
    <Modal>
      <Photo id={id} />
    </Modal>
  );
}
```

### Loading and Error States

```typescript
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-64 bg-gray-200 rounded" />
    </div>
  );
}

// app/dashboard/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 rounded">
      <h2 className="text-red-800 font-bold">Something went wrong!</h2>
      <p className="text-red-600">{error.message}</p>
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

### Route Handlers

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  const users = await db.user.findMany({
    where: query ? { name: { contains: query } } : undefined,
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const user = await db.user.create({
    data: body,
  });

  return NextResponse.json(user, { status: 201 });
}

// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await db.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}
```

### Streaming with Suspense

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { Analytics, RecentActivity, Stats } from '@/components';
import { StatsSkeleton, ActivitySkeleton } from '@/components/skeletons';

export default function Dashboard() {
  return (
    <div className="grid gap-4">
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>

        <Suspense fallback={<div>Loading analytics...</div>}>
          <Analytics />
        </Suspense>
      </div>
    </div>
  );
}
```

## Best Practices

- Use route groups to organize without affecting URL
- Implement loading.tsx for immediate feedback
- Use error.tsx for graceful error handling
- Leverage parallel routes for complex layouts
- Use intercepting routes for modal patterns

## Target Processes

- nextjs-full-stack
- frontend-architecture-design
- app-router-migration
- performance-optimization
