# Zustand Skill

Lightweight state management for React with Zustand, featuring middleware, persistence, and TypeScript support.

## Overview

This skill provides expertise in Zustand, a minimal, flexible state management solution that offers simplicity without sacrificing power.

## When to Use

- Lightweight global state needs
- Replacing Context API for performance
- Persisting state to localStorage
- Creating modular stores with slices
- Projects where Redux is overkill

## Quick Start

```typescript
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// In component
const count = useStore((state) => state.count);
```

## Key Features

| Feature | Description |
|---------|-------------|
| Minimal API | Simple create function |
| No providers | Direct store access |
| Middleware | devtools, persist, immer |
| Selectors | Fine-grained subscriptions |
| TypeScript | Full type inference |

## Middleware Stack

```typescript
create<Store>()(
  devtools(
    persist(
      immer((set) => ({
        // store definition
      })),
      { name: 'storage-key' }
    ),
    { name: 'DevToolsName' }
  )
);
```

## Integration

Pairs well with react-query-skill for server state, while Zustand handles client state.
