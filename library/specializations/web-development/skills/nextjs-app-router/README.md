# Next.js App Router Skill

Advanced Next.js App Router patterns for modern React applications with file-based routing.

## Overview

This skill provides expertise in Next.js 14+ App Router, covering advanced patterns like parallel routes, intercepting routes, route groups, and streaming.

## When to Use

- Structuring complex Next.js applications
- Implementing modal patterns with route interception
- Creating parallel route layouts
- Setting up streaming and loading states
- Building API route handlers

## Key Patterns

### Route Groups
```
app/
├── (auth)/           # Groups without URL impact
│   └── login/
├── (dashboard)/
│   └── analytics/
```

### Parallel Routes
```
app/
├── @modal/           # Parallel slot
├── @sidebar/         # Another slot
└── layout.tsx        # Combines slots
```

### Intercepting Routes
```
app/
├── @modal/
│   └── (.)photos/[id]/  # Intercepts /photos/[id]
└── photos/[id]/
```

## File Conventions

| File | Purpose |
|------|---------|
| page.tsx | Route UI |
| layout.tsx | Shared layout |
| loading.tsx | Loading state |
| error.tsx | Error boundary |
| not-found.tsx | 404 page |
| route.ts | API endpoint |

## Integration

Works with nextjs-skill and react-server-components-skill for complete Next.js development.
