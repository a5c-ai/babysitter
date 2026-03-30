---
name: react-server-components
description: React Server Components patterns including streaming, data fetching, client/server component composition, and performance optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# React Server Components Skill

Expert assistance for implementing React Server Components with proper patterns and composition strategies.

## Capabilities

- Design server/client component boundaries
- Implement streaming with Suspense
- Handle data fetching in server components
- Compose server and client components
- Optimize performance with selective hydration
- Manage server actions for mutations

## Usage

Invoke this skill when you need to:
- Structure RSC application architecture
- Implement streaming data fetching
- Determine server vs client components
- Pass server data to client components
- Build server actions for forms

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentType | string | Yes | server, client, shared |
| dataFetching | boolean | No | Component fetches data |
| interactivity | array | No | Required client interactions |
| streaming | boolean | No | Enable streaming |

### Configuration Example

```json
{
  "componentType": "server",
  "dataFetching": true,
  "streaming": true,
  "childComponents": [
    { "name": "InteractiveChart", "type": "client" }
  ]
}
```

## Component Patterns

### Server Component (Default)

```typescript
// app/users/page.tsx - Server Component by default
import { db } from '@/lib/db';
import { UserCard } from './user-card';

async function getUsers() {
  return db.user.findMany({
    include: { posts: true },
  });
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="grid gap-4">
      <h1>Users</h1>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Client Component

```typescript
// components/interactive-counter.tsx
'use client';

import { useState } from 'react';

export function InteractiveCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Composition Pattern

```typescript
// app/dashboard/page.tsx - Server Component
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { InteractiveChart } from '@/components/interactive-chart';
import { ChartSkeleton } from '@/components/skeletons';

async function getAnalytics() {
  return db.analytics.findMany({
    orderBy: { date: 'desc' },
    take: 30,
  });
}

export default async function Dashboard() {
  const analytics = await getAnalytics();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Pass server data to client component */}
      <Suspense fallback={<ChartSkeleton />}>
        <InteractiveChart data={analytics} />
      </Suspense>
    </div>
  );
}

// components/interactive-chart.tsx - Client Component
'use client';

import { useState } from 'react';
import { LineChart } from 'recharts';

interface ChartProps {
  data: AnalyticsData[];
}

export function InteractiveChart({ data }: ChartProps) {
  const [timeRange, setTimeRange] = useState('7d');

  const filteredData = filterByTimeRange(data, timeRange);

  return (
    <div>
      <select
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
      >
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
      <LineChart data={filteredData} />
    </div>
  );
}
```

### Streaming with Suspense

```typescript
// app/page.tsx
import { Suspense } from 'react';
import { SlowComponent, FastComponent } from '@/components';

export default function Page() {
  return (
    <div>
      {/* Fast content renders immediately */}
      <FastComponent />

      {/* Slow content streams in */}
      <Suspense fallback={<p>Loading slow content...</p>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

// components/slow-component.tsx
async function getSlowData() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return { data: 'Slow data loaded' };
}

export async function SlowComponent() {
  const data = await getSlowData();
  return <div>{data.data}</div>;
}
```

### Server Actions

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  await db.user.create({
    data: { name, email },
  });

  revalidatePath('/users');
}

export async function updateUser(id: string, formData: FormData) {
  const name = formData.get('name') as string;

  await db.user.update({
    where: { id },
    data: { name },
  });

  revalidatePath(`/users/${id}`);
}

// components/user-form.tsx
'use client';

import { useFormStatus } from 'react-dom';
import { createUser } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </button>
  );
}

export function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <SubmitButton />
    </form>
  );
}
```

### Passing Server Components as Props

```typescript
// Pattern: Server Component as children
// app/page.tsx
import { ClientWrapper } from '@/components/client-wrapper';
import { ServerContent } from '@/components/server-content';

export default function Page() {
  return (
    <ClientWrapper>
      <ServerContent />
    </ClientWrapper>
  );
}

// components/client-wrapper.tsx
'use client';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  );
}
```

## Decision Framework

### Use Server Components When:
- Fetching data
- Accessing backend resources directly
- Keeping sensitive information on server
- Keeping large dependencies on server
- No interactivity needed

### Use Client Components When:
- Using useState, useEffect, useReducer
- Using browser APIs
- Adding event listeners
- Using custom hooks with state
- Using React Context providers

## Best Practices

- Default to Server Components
- Push client boundaries down the tree
- Pass serializable props to client components
- Use Suspense for streaming
- Colocate data fetching with components

## Target Processes

- nextjs-full-stack
- react-server-components-migration
- performance-optimization
- streaming-implementation
