# React Development Skill

Expert assistance for building modern React applications with TypeScript, hooks, state management, and performance optimization.

## Overview

This skill provides specialized guidance and code generation for React development, following modern patterns and best practices. It helps create maintainable, performant, and accessible React applications.

## When to Use

- Creating new React components with proper structure
- Implementing custom hooks for reusable logic
- Setting up state management (Context, Redux, Zustand)
- Optimizing component performance
- Building accessible UI components
- Writing component tests

## Quick Start

### Basic Component

```json
{
  "componentName": "Button",
  "typescript": true,
  "props": [
    { "name": "variant", "type": "'primary' | 'secondary'", "required": false },
    { "name": "onClick", "type": "() => void", "required": true },
    { "name": "children", "type": "ReactNode", "required": true }
  ]
}
```

### Component with State Management

```json
{
  "componentName": "TodoList",
  "stateManagement": "zustand",
  "features": ["crud", "filtering", "persistence"],
  "testing": true
}
```

### Custom Hook

```json
{
  "hookName": "useDebounce",
  "parameters": [
    { "name": "value", "type": "T" },
    { "name": "delay", "type": "number" }
  ],
  "returnType": "T"
}
```

## Generated Structure

```
src/
├── components/
│   └── Button/
│       ├── index.ts                # Barrel export
│       ├── Button.tsx              # Component
│       ├── Button.types.ts         # TypeScript types
│       ├── Button.test.tsx         # Unit tests
│       └── Button.module.css       # Styles (if CSS Modules)
├── hooks/
│   ├── index.ts                    # Hook exports
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── context/
│   ├── index.ts
│   └── ThemeContext.tsx
└── stores/                         # If using Zustand/Redux
    └── todoStore.ts
```

## Features

### Component Patterns

- **Functional Components**: Modern function components with hooks
- **TypeScript Integration**: Full type safety for props, state, and context
- **Composition**: Compound components, render props, and HOCs
- **Forwarding Refs**: Proper ref forwarding for DOM access

### State Management

- **useState/useReducer**: Local component state
- **Context API**: App-wide state without external libraries
- **Zustand**: Lightweight global state
- **Redux Toolkit**: Enterprise-scale state management
- **TanStack Query**: Server state management

### Performance

- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Memoize values and callbacks
- **Code Splitting**: Lazy loading with Suspense
- **Virtualization**: Large list rendering

### Testing

- **React Testing Library**: User-centric testing
- **Component Testing**: Rendering and interaction tests
- **Hook Testing**: renderHook utility
- **Snapshot Testing**: Visual regression prevention

## Example Generated Code

### TypeScript Component

```typescript
import { forwardRef, memo } from 'react';
import type { ButtonProps } from './Button.types';
import styles from './Button.module.css';

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'primary', onClick, children, disabled, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`${styles.button} ${styles[variant]}`}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
));

Button.displayName = 'Button';
```

### Custom Hook

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Zustand Store

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (text) =>
        set((state) => ({
          todos: [...state.todos, { id: crypto.randomUUID(), text, completed: false }],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
    }),
    { name: 'todo-storage' }
  )
);
```

### Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button onClick={() => {}} disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| react-application-development | Primary development skill |
| component-library-creation | Component scaffolding |
| state-management-setup | Context/store generation |
| frontend-testing | Test generation |
| performance-optimization | Optimization patterns |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| typescript | true | Generate TypeScript code |
| testing | true | Generate unit tests |
| storybook | false | Generate Storybook stories |
| cssModule | true | Use CSS Modules for styling |
| strictMode | true | Enable React Strict Mode |

## Best Practices

1. **Component Organization**: One component per file, co-located tests
2. **Props Design**: Explicit typing, sensible defaults
3. **Hook Rules**: Only call hooks at top level
4. **Memoization**: Memo expensive renders, not everything
5. **Accessibility**: Semantic HTML, ARIA attributes

## References

- [React Documentation](https://react.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)
