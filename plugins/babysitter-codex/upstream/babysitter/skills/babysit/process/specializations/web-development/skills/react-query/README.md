# React Query Skill

TanStack Query (React Query) for powerful server state management with caching, synchronization, and background updates.

## Overview

This skill provides expertise in TanStack Query, the gold standard for data fetching in React applications, handling caching, background updates, stale data, and more.

## When to Use

- Fetching and caching server data
- Handling complex data synchronization
- Implementing optimistic updates
- Building infinite scroll features
- Prefetching data for navigation

## Quick Start

```typescript
import { useQuery } from '@tanstack/react-query';

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <UserList users={data} />;
}
```

## Key Features

| Feature | Description |
|---------|-------------|
| Caching | Automatic caching with configurable stale times |
| Background Updates | Refetch on window focus, interval, or network recovery |
| Optimistic Updates | Instant UI updates with rollback on error |
| Infinite Queries | Built-in pagination and infinite scroll |
| Prefetching | Prefetch data before it's needed |

## Query vs Mutation

```typescript
// Query: GET data
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// Mutation: POST/PUT/DELETE
const { mutate } = useMutation({
  mutationFn: createUser,
  onSuccess: () => queryClient.invalidateQueries(['users']),
});
```

## Integration

Works with zustand-skill for client state while React Query handles server state.
