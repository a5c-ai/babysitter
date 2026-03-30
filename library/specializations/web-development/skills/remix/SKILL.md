---
name: remix
description: Remix patterns including loaders, actions, nested routing, progressive enhancement, and deployment strategies.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Remix Skill

Expert assistance for building full-stack applications with Remix.

## Capabilities

- Implement loaders for data fetching
- Create actions for mutations
- Configure nested routing with outlets
- Build progressively enhanced forms
- Handle errors and boundaries
- Set up deployment for various platforms

## Usage

Invoke this skill when you need to:
- Build full-stack React applications
- Implement progressive enhancement
- Create nested layouts with data
- Handle form submissions properly
- Deploy to edge platforms

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| routePath | string | Yes | Route path |
| hasLoader | boolean | No | Include loader |
| hasAction | boolean | No | Include action |
| nested | boolean | No | Has nested routes |

## Route Patterns

### Loader and Action

```typescript
// app/routes/users.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';

  const users = await db.user.findMany({
    where: search ? { name: { contains: search } } : undefined,
    orderBy: { name: 'asc' },
  });

  return json({ users, search });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'create') {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
      return json({ error: 'Name and email required' }, { status: 400 });
    }

    await db.user.create({ data: { name, email } });
    return redirect('/users');
  }

  if (intent === 'delete') {
    const id = formData.get('id') as string;
    await db.user.delete({ where: { id } });
    return json({ success: true });
  }

  return json({ error: 'Invalid intent' }, { status: 400 });
}

export default function Users() {
  const { users, search } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const isSearching = navigation.state === 'loading' &&
    navigation.location.pathname === '/users';

  return (
    <div>
      <h1>Users</h1>

      {/* Search Form - GET request, progressive enhancement */}
      <Form method="get">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search users..."
        />
        <button type="submit">Search</button>
      </Form>

      {/* Create Form - POST request */}
      <Form method="post">
        <input type="hidden" name="intent" value="create" />
        <input name="name" placeholder="Name" required />
        <input name="email" type="email" placeholder="Email" required />
        <button type="submit">Add User</button>
      </Form>

      {isSearching ? (
        <p>Searching...</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} - {user.email}
              <Form method="post" style={{ display: 'inline' }}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={user.id} />
                <button type="submit">Delete</button>
              </Form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Nested Routes

```typescript
// app/routes/dashboard.tsx
import { Outlet, NavLink } from '@remix-run/react';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <nav>
        <NavLink to="/dashboard" end>Overview</NavLink>
        <NavLink to="/dashboard/analytics">Analytics</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

// app/routes/dashboard._index.tsx
export default function DashboardIndex() {
  return <h2>Dashboard Overview</h2>;
}

// app/routes/dashboard.analytics.tsx
export async function loader() {
  const analytics = await getAnalytics();
  return json({ analytics });
}

export default function Analytics() {
  const { analytics } = useLoaderData<typeof loader>();
  return <AnalyticsChart data={analytics} />;
}
```

### Error Boundaries

```typescript
// app/routes/users.$userId.tsx
import { useRouteError, isRouteErrorResponse } from '@remix-run/react';

export async function loader({ params }: LoaderFunctionArgs) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
  });

  if (!user) {
    throw new Response('User not found', { status: 404 });
  }

  return json({ user });
}

export default function User() {
  const { user } = useLoaderData<typeof loader>();
  return <UserProfile user={user} />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="error">
        <h2>{error.status} {error.statusText}</h2>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div className="error">
      <h2>Something went wrong</h2>
      <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  );
}
```

### Optimistic UI

```typescript
// app/routes/todos.tsx
import { useFetcher } from '@remix-run/react';

function TodoItem({ todo }: { todo: Todo }) {
  const fetcher = useFetcher();

  const isDeleting = fetcher.state !== 'idle' &&
    fetcher.formData?.get('intent') === 'delete';

  const isToggling = fetcher.state !== 'idle' &&
    fetcher.formData?.get('intent') === 'toggle';

  // Optimistic state
  const completed = isToggling
    ? !todo.completed
    : todo.completed;

  if (isDeleting) return null;

  return (
    <li style={{ opacity: fetcher.state !== 'idle' ? 0.5 : 1 }}>
      <fetcher.Form method="post">
        <input type="hidden" name="id" value={todo.id} />
        <input type="hidden" name="intent" value="toggle" />
        <button type="submit">
          {completed ? '✓' : '○'}
        </button>
      </fetcher.Form>

      <span>{todo.title}</span>

      <fetcher.Form method="post">
        <input type="hidden" name="id" value={todo.id} />
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">×</button>
      </fetcher.Form>
    </li>
  );
}
```

### Session and Authentication

```typescript
// app/utils/session.server.ts
import { createCookieSessionStorage, redirect } from '@remix-run/node';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set('userId', userId);

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserId(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie')
  );
  return session.get('userId');
}

export async function requireUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect('/login');
  }
  return userId;
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get('Cookie')
  );

  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
```

## Best Practices

- Use loaders for GET requests (data fetching)
- Use actions for POST/PUT/DELETE (mutations)
- Leverage progressive enhancement with Form
- Use useFetcher for non-navigation mutations
- Implement proper error boundaries

## Target Processes

- remix-full-stack
- progressive-enhancement
- edge-deployment
- form-handling
