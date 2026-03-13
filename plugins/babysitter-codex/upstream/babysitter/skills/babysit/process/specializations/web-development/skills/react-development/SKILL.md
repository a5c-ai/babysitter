---
name: react-development
description: Specialized skill for React component development, hooks patterns, state management, context API, performance optimization, and modern React best practices.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# React Development Skill

Expert assistance for building React applications with modern patterns, hooks, state management, and performance optimization.

## Capabilities

- Generate React components with TypeScript and proper typing
- Implement custom hooks with composition patterns
- Configure state management (Context API, Redux Toolkit, Zustand)
- Optimize rendering performance with memoization
- Set up component testing with React Testing Library
- Create accessible, reusable component libraries

## Usage

Invoke this skill when you need to:
- Create new React components with best practices
- Implement custom hooks for shared logic
- Set up state management architecture
- Optimize component rendering performance
- Configure React project structure

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentName | string | Yes | Name of the component (PascalCase) |
| componentType | string | No | functional, class (default: functional) |
| stateManagement | string | No | context, redux, zustand, jotai, none |
| typescript | boolean | No | Use TypeScript (default: true) |
| testing | boolean | No | Generate tests (default: true) |
| storybook | boolean | No | Generate Storybook stories (default: false) |

### Component Configuration

```json
{
  "componentName": "UserProfile",
  "componentType": "functional",
  "props": [
    { "name": "user", "type": "User", "required": true },
    { "name": "onUpdate", "type": "(user: User) => void", "required": false }
  ],
  "hooks": ["useState", "useEffect", "useCallback"],
  "typescript": true,
  "testing": true
}
```

## Output Structure

```
src/
├── components/
│   └── UserProfile/
│       ├── index.ts                 # Barrel export
│       ├── UserProfile.tsx          # Component implementation
│       ├── UserProfile.types.ts     # Type definitions
│       ├── UserProfile.hooks.ts     # Custom hooks
│       ├── UserProfile.styles.ts    # Styled components or CSS modules
│       ├── UserProfile.test.tsx     # Unit tests
│       └── UserProfile.stories.tsx  # Storybook stories (optional)
├── hooks/
│   ├── index.ts                     # Hook exports
│   ├── useDebounce.ts              # Debounce hook
│   ├── useLocalStorage.ts          # LocalStorage hook
│   └── useFetch.ts                 # Data fetching hook
└── context/
    ├── index.ts                     # Context exports
    └── UserContext.tsx             # User context provider
```

## Generated Code Patterns

### Functional Component Template

```typescript
import { memo, useCallback, useState } from 'react';
import type { UserProfileProps } from './UserProfile.types';
import { useUserData } from './UserProfile.hooks';

export const UserProfile = memo(function UserProfile({
  user,
  onUpdate,
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { updateUser, isLoading } = useUserData();

  const handleSave = useCallback(async (data: UserData) => {
    await updateUser(data);
    onUpdate?.(data);
    setIsEditing(false);
  }, [updateUser, onUpdate]);

  return (
    <div className="user-profile" role="region" aria-label="User Profile">
      {/* Component content */}
    </div>
  );
});

UserProfile.displayName = 'UserProfile';
```

### Custom Hook Template

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseAsyncDataOptions<T> {
  initialData?: T;
  onError?: (error: Error) => void;
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncDataOptions<T> = {}
) {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}
```

### Context Provider Template

```typescript
import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from 'react';

interface State {
  user: User | null;
  isAuthenticated: boolean;
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' };

const initialState: State = {
  user: null,
  isAuthenticated: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}

const UserContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

## Performance Optimization Patterns

### Memoization

```typescript
// Memoize expensive computations
const sortedItems = useMemo(() =>
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// Memoize callbacks to prevent child re-renders
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);

// Memoize components
const MemoizedChild = memo(ChildComponent);
```

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  );
}
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^2.0.0"
  }
}
```

## Workflow

1. **Analyze requirements** - Determine component structure and state needs
2. **Create type definitions** - Define props, state, and context types
3. **Implement component** - Build with hooks and proper patterns
4. **Add custom hooks** - Extract reusable logic
5. **Optimize performance** - Apply memoization where needed
6. **Write tests** - Component and hook unit tests
7. **Add accessibility** - ARIA attributes and keyboard navigation

## Best Practices Applied

- TypeScript strict mode with proper typing
- Functional components with hooks (no class components)
- Custom hooks for shared logic
- Context API for app-wide state
- Memoization for performance
- Proper error boundaries
- Accessibility (a11y) compliance
- Testing with React Testing Library

## References

- React Documentation: https://react.dev/
- React Hooks: https://react.dev/reference/react/hooks
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- web-artifacts-builder: https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder
- react-mcp: https://github.com/kalivaraprasad-gonapa/react-mcp

## Target Processes

- react-application-development
- component-library-creation
- state-management-setup
- performance-optimization
- frontend-testing
