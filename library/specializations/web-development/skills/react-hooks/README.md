# React Hooks Skill

Deep expertise in React hooks patterns for building reusable, composable logic in React applications.

## Overview

This skill provides specialized guidance for implementing custom React hooks with proper patterns, composition strategies, and performance optimization techniques.

## When to Use

- Creating custom hooks for shared logic
- Optimizing hook performance
- Building data fetching abstractions
- Implementing form handling logic
- Managing subscriptions and side effects

## Key Patterns

### Custom Hook Template

```typescript
function useCustomHook<T>(config: Config): HookReturn<T> {
  // State declarations
  const [state, setState] = useState<T>();

  // Refs for stable values
  const ref = useRef(config);

  // Memoized callbacks
  const handler = useCallback(() => {
    // logic
  }, [dependencies]);

  // Effects with cleanup
  useEffect(() => {
    // setup
    return () => {
      // cleanup
    };
  }, [dependencies]);

  // Return stable object
  return useMemo(() => ({
    state,
    handler,
  }), [state, handler]);
}
```

## Common Hooks

| Hook | Purpose |
|------|---------|
| useDebounce | Debounce value changes |
| useThrottle | Throttle value changes |
| useLocalStorage | Persist state to localStorage |
| usePrevious | Track previous value |
| useOnClickOutside | Detect clicks outside element |
| useMediaQuery | Respond to media queries |
| useIntersectionObserver | Track element visibility |

## Integration

Works with react-development-skill and react-testing-library-skill for comprehensive React development workflows.
