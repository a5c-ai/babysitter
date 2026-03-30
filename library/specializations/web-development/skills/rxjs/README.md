# RxJS Skill

Reactive programming with RxJS for handling asynchronous data streams in JavaScript and Angular.

## Overview

This skill provides expertise in RxJS, the library for reactive programming using Observables, enabling composition of asynchronous and event-based programs.

## When to Use

- Handling HTTP requests in Angular
- Managing real-time data streams
- Composing complex async operations
- Implementing search/autocomplete
- WebSocket communication

## Quick Start

```typescript
import { fromEvent, debounceTime, map, switchMap } from 'rxjs';

const search$ = fromEvent(input, 'input').pipe(
  debounceTime(300),
  map(e => e.target.value),
  switchMap(term => fetchResults(term))
);
```

## Common Operators

| Operator | Use Case |
|----------|----------|
| map | Transform values |
| filter | Filter values |
| switchMap | Cancel previous, use latest |
| mergeMap | Process all concurrently |
| catchError | Handle errors |
| debounceTime | Wait for pause in events |

## Pattern Examples

```typescript
// HTTP with retry
http.get('/api').pipe(
  retry(3),
  catchError(() => of(fallback))
);

// Combine latest values
combineLatest([user$, settings$]).pipe(
  map(([user, settings]) => ({ user, settings }))
);
```

## Integration

Essential for angular-development-skill and ngrx-skill.
