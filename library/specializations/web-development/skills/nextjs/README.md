# Next.js Skill

Expert assistance for building full-stack Next.js applications with App Router, React Server Components, Server Actions, and modern deployment patterns.

## Overview

This skill provides specialized guidance for Next.js development, focusing on the App Router architecture, React Server Components, Server Actions, and performance optimization. It helps create production-ready applications following Next.js best practices.

## When to Use

- Creating a new Next.js application with App Router
- Implementing React Server Components
- Setting up Server Actions for forms and mutations
- Configuring advanced routing patterns
- Optimizing for Core Web Vitals and SEO
- Deploying to Vercel or other platforms

## Quick Start

### Basic Project

```json
{
  "projectName": "my-app",
  "styling": "tailwind",
  "typescript": true
}
```

### Full-Stack SaaS

```json
{
  "projectName": "saas-platform",
  "features": [
    "authentication",
    "database",
    "api-routes",
    "server-actions",
    "edge-middleware"
  ],
  "database": "prisma",
  "auth": "nextauth",
  "styling": "tailwind"
}
```

### E-commerce Site

```json
{
  "projectName": "store",
  "features": [
    "product-catalog",
    "shopping-cart",
    "checkout",
    "admin-dashboard"
  ],
  "database": "prisma",
  "styling": "tailwind"
}
```

## Generated Structure

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Home page (RSC)
├── loading.tsx                # Global loading state
├── error.tsx                  # Global error boundary
├── not-found.tsx             # 404 page
├── (marketing)/              # Route group (no /marketing in URL)
│   ├── page.tsx              # Landing page
│   ├── pricing/page.tsx
│   └── about/page.tsx
├── (dashboard)/              # Protected route group
│   ├── layout.tsx            # Dashboard layout with sidebar
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   └── webhooks/stripe/route.ts
└── [...slug]/page.tsx        # Catch-all route
```

## Features

### React Server Components

```typescript
// Server Component (default in App Router)
async function ProductList() {
  const products = await db.product.findMany();

  return (
    <ul>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

### Server Actions

```typescript
// lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);

  await db.product.create({ data: { name, price } });
  revalidatePath('/products');
}
```

### Streaming with Suspense

```typescript
import { Suspense } from 'react';
import { ProductListSkeleton } from '@/components/skeletons';

export default function Page() {
  return (
    <main>
      <h1>Products</h1>
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
      </Suspense>
    </main>
  );
}
```

### Parallel Routes

```
dashboard/
├── layout.tsx
├── page.tsx
├── @analytics/
│   ├── page.tsx
│   └── loading.tsx
└── @team/
    ├── page.tsx
    └── loading.tsx
```

```typescript
// dashboard/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <main className="col-span-2">{children}</main>
      <aside>
        {analytics}
        {team}
      </aside>
    </div>
  );
}
```

### Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

## Caching Strategies

### Route Segment Config

```typescript
// Static page (built at build time)
export const dynamic = 'force-static';

// Dynamic page (rendered on every request)
export const dynamic = 'force-dynamic';

// Revalidate every hour
export const revalidate = 3600;
```

### Fetch Caching

```typescript
// Cached indefinitely (default)
const data = await fetch(url);

// Revalidate every 60 seconds
const data = await fetch(url, { next: { revalidate: 60 } });

// No caching
const data = await fetch(url, { cache: 'no-store' });

// Tag-based revalidation
const data = await fetch(url, { next: { tags: ['products'] } });
```

### On-Demand Revalidation

```typescript
import { revalidatePath, revalidateTag } from 'next/cache';

// Revalidate a specific path
revalidatePath('/products');

// Revalidate all data with a specific tag
revalidateTag('products');
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| nextjs-full-stack-development | Primary development skill |
| server-component-architecture | RSC patterns |
| api-route-implementation | Route handlers |
| authentication-setup | NextAuth/Clerk integration |
| deployment-optimization | Vercel deployment |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| router | app | App Router or Pages Router |
| typescript | true | TypeScript support |
| styling | tailwind | CSS solution |
| database | none | Database ORM |
| auth | none | Authentication provider |

## Performance Optimizations

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Load above-the-fold images immediately
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### Font Optimization

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

### Metadata API

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Page',
  description: 'View our products',
  openGraph: {
    title: 'Product Page',
    description: 'View our products',
    images: ['/og-image.jpg'],
  },
};
```

## Best Practices

1. **Server First**: Default to Server Components
2. **Client Boundary**: Use 'use client' only when needed
3. **Streaming**: Use Suspense for progressive rendering
4. **Caching**: Configure appropriate cache strategies
5. **Error Handling**: Implement error.tsx boundaries

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Caching in Next.js](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel Deployment](https://vercel.com/docs)
