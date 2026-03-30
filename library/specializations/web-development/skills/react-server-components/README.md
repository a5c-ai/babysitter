# React Server Components Skill

Expert guidance for React Server Components architecture, streaming, and client/server composition.

## Overview

This skill provides deep expertise in React Server Components (RSC), helping you build performant applications by rendering components on the server while maintaining interactivity where needed.

## When to Use

- Designing RSC architecture
- Determining server vs client boundaries
- Implementing streaming data fetching
- Building server actions for mutations
- Optimizing bundle size with RSC

## Key Concepts

### Server Component (Default)
```typescript
// No 'use client' - runs on server
async function UserList() {
  const users = await db.user.findMany();
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Client Component
```typescript
'use client';
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## Decision Matrix

| Need | Component Type |
|------|---------------|
| Data fetching | Server |
| useState/useEffect | Client |
| Event handlers | Client |
| Browser APIs | Client |
| Direct DB access | Server |
| Static content | Server |

## Benefits

- Smaller client bundles
- Direct backend access
- Streaming support
- No client-side data fetching waterfall

## Integration

Core pattern for nextjs-skill and nextjs-app-router-skill.
