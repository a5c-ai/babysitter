---
name: react-query
description: TanStack Query (React Query) patterns for server state management, caching, mutations, optimistic updates, and infinite queries.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# React Query Skill

Expert assistance for implementing TanStack Query (React Query) for server state management in React applications.

## Capabilities

- Configure QueryClient with optimal defaults
- Implement queries with caching strategies
- Handle mutations with optimistic updates
- Set up infinite queries for pagination
- Manage query invalidation and prefetching
- Integrate with authentication and error handling

## Usage

Invoke this skill when you need to:
- Fetch and cache server data
- Handle mutations with rollback
- Implement infinite scroll or pagination
- Prefetch data for navigation
- Synchronize server state

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| endpoint | string | Yes | API endpoint to query |
| queryKey | array | Yes | Unique query key |
| staleTime | number | No | Time until data is stale (ms) |
| cacheTime | number | No | Time to keep in cache (ms) |
| optimisticUpdate | boolean | No | Enable optimistic updates |

### Configuration Example

```json
{
  "endpoint": "/api/users",
  "queryKey": ["users"],
  "staleTime": 300000,
  "cacheTime": 600000,
  "optimisticUpdate": true
}
```

## Generated Patterns

### Query Client Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Basic Query Hook

```typescript
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });
}
```

### Mutation with Optimistic Update

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateUserDto {
  id: string;
  name?: string;
  email?: string;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserDto) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },

    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', newData.id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', newData.id]);

      // Optimistically update
      queryClient.setQueryData(['users', newData.id], (old: User) => ({
        ...old,
        ...newData,
      }));

      return { previousUser };
    },

    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['users', newData.id], context.previousUser);
      }
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### Infinite Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface Page {
  data: User[];
  nextCursor?: string;
}

async function fetchUsersPage({ pageParam }: { pageParam?: string }): Promise<Page> {
  const url = pageParam
    ? `/api/users?cursor=${pageParam}`
    : '/api/users';
  const response = await fetch(url);
  return response.json();
}

export function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: fetchUsersPage,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.previousCursor,
  });
}

// Usage in component
function UserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </React.Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No more'}
      </button>
    </div>
  );
}
```

### Prefetching

```typescript
import { useQueryClient } from '@tanstack/react-query';

function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <Link
      to={`/users/${userId}`}
      onMouseEnter={prefetchUser}
      onFocus={prefetchUser}
    >
      View User
    </Link>
  );
}
```

### Query Keys Factory

```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
useQuery({ queryKey: userKeys.detail(userId), ... });
queryClient.invalidateQueries({ queryKey: userKeys.lists() });
```

## Best Practices

- Use query key factories for consistency
- Set appropriate staleTime for your data
- Implement optimistic updates for better UX
- Use placeholderData or initialData strategically
- Separate server state from client state

## Target Processes

- react-application-development
- nextjs-full-stack
- data-fetching-setup
- performance-optimization
