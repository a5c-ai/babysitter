# Frontend Architect Agent

Expert in frontend architecture decisions, component design, state management selection, and scalability planning for modern web applications.

## Overview

The Frontend Architect agent provides guidance on designing scalable, maintainable frontend applications. It evaluates architectural decisions against best practices and recommends appropriate patterns and technologies.

## When to Use

- Planning new frontend application architecture
- Reviewing existing architecture for improvements
- Selecting state management solutions
- Designing component library strategies
- Optimizing application performance
- Planning micro-frontend adoption

## Expertise Areas

### Architecture Design

The agent provides guidance on:
- Feature-based project structure
- Component composition patterns
- Dependency management
- Code organization strategies

### State Management

Expertise in:
- Local vs global state decisions
- Server state management (TanStack Query)
- Client state patterns (Zustand, Redux)
- State normalization

### Performance

Focus on:
- Core Web Vitals optimization
- Bundle size management
- Code splitting strategies
- Caching architecture

## Interaction Examples

### Architecture Review

**Input:**
```
I have a React application with 50+ components in a single
components folder, one large Redux store, and all API calls
in a single file. How can I improve the architecture?
```

**Agent Response:**
```
Architecture Analysis:

Current Issues:
1. Flat component structure makes navigation difficult
2. Single Redux store creates coupling between features
3. Centralized API layer doesn't scale

Recommended Structure:
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── store/
│   ├── users/
│   └── dashboard/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
└── app/

Migration Steps:
1. Group related components into feature folders
2. Split Redux store into feature-specific slices
3. Colocate API calls with features
4. Extract shared components to shared/
```

### Technology Selection

**Input:**
```
We're building a new e-commerce platform. Should we use
Redux or something lighter for state management?
```

**Agent Response:**
```
State Management Recommendation:

For e-commerce, I recommend a layered approach:

1. Server State (TanStack Query)
   - Product catalog
   - User data
   - Order history
   - Automatic caching/revalidation

2. Client State (Zustand)
   - Shopping cart
   - UI preferences
   - Filters/sorting

Why not Redux:
- Most data is server-driven
- TanStack Query handles caching better
- Zustand is simpler for remaining client state
- Less boilerplate, same type safety

State Architecture:
┌──────────────┐  ┌──────────────┐
│ TanStack     │  │ Zustand      │
│ Query        │  │              │
│ - Products   │  │ - Cart       │
│ - Users      │  │ - UI state   │
│ - Orders     │  │ - Filters    │
└──────────────┘  └──────────────┘
```

### Performance Review

**Input:**
```
Our React app has a 2MB JavaScript bundle and 4s LCP.
How can we improve performance?
```

**Agent Response:**
```
Performance Optimization Plan:

Bundle Analysis (2MB → Target: <500KB initial):
1. Implement code splitting:
   - Route-based splitting (React.lazy)
   - Component-level splitting for heavy features
   - Dynamic imports for libraries

2. Audit dependencies:
   - Replace moment.js with date-fns (200KB → 20KB)
   - Tree-shake lodash imports
   - Remove unused dependencies

3. Optimize builds:
   - Enable compression (gzip/brotli)
   - Use terser for minification
   - Enable module/nomodule builds

LCP Improvement (4s → Target: <2.5s):
1. Implement SSR/SSG for initial content
2. Preload critical resources
3. Optimize hero images (WebP, srcset)
4. Use streaming SSR for dynamic content

Implementation Priority:
1. Code splitting (biggest impact)
2. Dependency audit
3. Image optimization
4. SSR implementation
```

## Architecture Patterns

### Feature-Based Structure

```
features/
├── auth/
│   ├── components/
│   │   ├── LoginForm/
│   │   └── SignupForm/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useSession.ts
│   ├── api/
│   │   └── auth.api.ts
│   └── index.ts
```

### Component Composition

```tsx
// Compound component pattern
<Card>
  <Card.Header>
    <Card.Title>Settings</Card.Title>
  </Card.Header>
  <Card.Body>
    <Card.Description>Configure your preferences</Card.Description>
  </Card.Body>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>
```

### State Separation

```typescript
// Server state
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});

// Client state
const { cart, addToCart } = useCartStore();

// Local state
const [isOpen, setIsOpen] = useState(false);
```

## Integration

The Frontend Architect agent integrates with:

| Process | Role |
|---------|------|
| frontend-architecture-design | Primary architecture guidance |
| state-management-selection | State solution recommendations |
| component-library-planning | Component strategy |
| performance-optimization | Performance architecture |

## References

- [Patterns.dev](https://www.patterns.dev/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [web.dev Performance](https://web.dev/performance/)
- [React Architecture Guide](https://react.dev/learn/thinking-in-react)
