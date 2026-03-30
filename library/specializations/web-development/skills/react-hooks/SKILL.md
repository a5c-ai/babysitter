---
name: react-hooks
description: Deep expertise in React hooks patterns including custom hooks, composition, optimization, and testing strategies.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# React Hooks Skill

Expert assistance for implementing React hooks with advanced patterns, composition strategies, and performance optimization.

## Capabilities

- Design and implement custom hooks with proper abstractions
- Compose hooks for complex state and side effect management
- Optimize hook performance with memoization patterns
- Implement hooks for data fetching, subscriptions, and local storage
- Test custom hooks with React Testing Library
- Apply hooks rules and best practices

## Usage

Invoke this skill when you need to:
- Create custom hooks for reusable logic
- Optimize existing hooks for performance
- Implement complex state logic with useReducer
- Build data fetching hooks with caching
- Create form handling hooks

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hookName | string | Yes | Name of the hook (use prefix) |
| purpose | string | Yes | What the hook should accomplish |
| parameters | array | No | Input parameters for the hook |
| returnType | string | No | Expected return value structure |
| dependencies | array | No | External dependencies needed |

### Configuration Example

```json
{
  "hookName": "useDebounce",
  "purpose": "Debounce a value with configurable delay",
  "parameters": [
    { "name": "value", "type": "T" },
    { "name": "delay", "type": "number" }
  ],
  "returnType": "T"
}
```

## Hook Patterns

### State Management Hooks

```typescript
// useReducer for complex state
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse };
}
```

### Effect Hooks

```typescript
// useEffect with cleanup
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement = window
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: WindowEventMap[K]) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);
    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
}
```

### Data Fetching Hooks

```typescript
function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          ...options,
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => abortController.abort();
  }, [url]);

  return { data, error, loading };
}
```

## Best Practices

- Always follow the Rules of Hooks
- Use the exhaustive-deps ESLint rule
- Memoize callbacks passed to child components
- Return stable references when possible
- Handle cleanup in useEffect properly
- Use refs for values that shouldn't trigger re-renders

## Target Processes

- react-application-development
- custom-hooks-library
- state-management-setup
- performance-optimization
- frontend-testing
