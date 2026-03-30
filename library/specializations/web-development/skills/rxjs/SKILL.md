---
name: rxjs
description: RxJS reactive programming patterns including operators, error handling, multicasting, and Angular integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# RxJS Skill

Expert assistance for implementing reactive programming with RxJS in Angular and JavaScript applications.

## Capabilities

- Create and compose observables
- Apply transformation and filtering operators
- Handle errors and retries
- Implement multicasting patterns
- Manage subscriptions and memory
- Integrate with Angular HTTP and forms

## Usage

Invoke this skill when you need to:
- Handle async data streams
- Compose complex data pipelines
- Implement real-time features
- Manage concurrent requests
- Handle WebSocket streams

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| useCase | string | Yes | http, websocket, events, state |
| operators | array | No | Specific operators needed |
| errorHandling | boolean | No | Include error handling |

### Configuration Example

```json
{
  "useCase": "http",
  "operators": ["switchMap", "debounceTime", "catchError"],
  "errorHandling": true
}
```

## Observable Patterns

### HTTP with Operators

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  Subject,
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  retry,
  shareReplay,
  tap,
  map,
  of,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private searchTerms = new Subject<string>();

  // Shared cache with replay
  private users$ = this.http.get<User[]>('/api/users').pipe(
    retry(3),
    shareReplay(1),
    catchError(() => of([]))
  );

  search(term: string) {
    this.searchTerms.next(term);
  }

  results$ = this.searchTerms.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) =>
      term.length < 2
        ? of([])
        : this.http.get<User[]>(`/api/users?search=${term}`).pipe(
            catchError(() => of([]))
          )
    )
  );
}
```

### State Management Pattern

```typescript
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';

interface AppState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class StateService {
  private state = new BehaviorSubject<AppState>({
    user: null,
    loading: false,
    error: null,
  });

  // Selectors
  user$ = this.select((state) => state.user);
  loading$ = this.select((state) => state.loading);
  error$ = this.select((state) => state.error);
  isAuthenticated$ = this.user$.pipe(map((user) => !!user));

  private select<T>(selector: (state: AppState) => T): Observable<T> {
    return this.state.pipe(map(selector), distinctUntilChanged());
  }

  setState(partial: Partial<AppState>) {
    this.state.next({ ...this.state.value, ...partial });
  }

  getState(): AppState {
    return this.state.value;
  }
}
```

### WebSocket Stream

```typescript
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import {
  Observable,
  retry,
  share,
  filter,
  map,
  takeUntil,
  Subject,
} from 'rxjs';

interface Message {
  type: string;
  payload: unknown;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket$: WebSocketSubject<Message> | null = null;
  private destroy$ = new Subject<void>();

  connect(url: string): Observable<Message> {
    if (!this.socket$) {
      this.socket$ = webSocket<Message>(url);
    }

    return this.socket$.pipe(
      retry({ delay: 3000, count: 5 }),
      share(),
      takeUntil(this.destroy$)
    );
  }

  on<T>(type: string): Observable<T> {
    return this.socket$!.pipe(
      filter((msg) => msg.type === type),
      map((msg) => msg.payload as T)
    );
  }

  send(type: string, payload: unknown) {
    this.socket$?.next({ type, payload });
  }

  disconnect() {
    this.destroy$.next();
    this.socket$?.complete();
    this.socket$ = null;
  }
}
```

### Combining Streams

```typescript
import {
  combineLatest,
  forkJoin,
  merge,
  concat,
  race,
  zip,
  switchMap,
  map,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  // Parallel requests - wait for all
  loadDashboard() {
    return forkJoin({
      user: this.http.get<User>('/api/user'),
      stats: this.http.get<Stats>('/api/stats'),
      notifications: this.http.get<Notification[]>('/api/notifications'),
    });
  }

  // Latest values from multiple streams
  dashboardData$ = combineLatest({
    user: this.userService.user$,
    theme: this.settingsService.theme$,
  }).pipe(
    map(({ user, theme }) => ({
      greeting: `Hello, ${user?.name}`,
      isDark: theme === 'dark',
    }))
  );

  // Merge multiple event streams
  allEvents$ = merge(
    this.userEvents$,
    this.systemEvents$,
    this.notificationEvents$
  );
}
```

### Error Handling Patterns

```typescript
import {
  catchError,
  retry,
  retryWhen,
  delay,
  throwError,
  EMPTY,
  of,
} from 'rxjs';

// Simple retry
this.http.get('/api/data').pipe(
  retry(3),
  catchError((error) => {
    console.error('Request failed:', error);
    return of(fallbackData);
  })
);

// Retry with delay
this.http.get('/api/data').pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => {
      console.log(`Retry ${retryCount}`);
      return of(null).pipe(delay(1000 * retryCount));
    },
  }),
  catchError((error) => throwError(() => new Error('Max retries exceeded')))
);

// Error recovery
this.http.get('/api/primary').pipe(
  catchError(() => this.http.get('/api/fallback')),
  catchError(() => of(defaultValue))
);
```

### Subscription Management

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({...})
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.dataService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.data = data;
      });

    this.userService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.user = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Operator Reference

| Category | Operators |
|----------|-----------|
| Creation | of, from, interval, timer, fromEvent |
| Transform | map, switchMap, mergeMap, concatMap, exhaustMap |
| Filter | filter, take, takeUntil, first, distinctUntilChanged |
| Combine | combineLatest, forkJoin, merge, concat, zip |
| Error | catchError, retry, throwError |
| Multicast | share, shareReplay, publish |

## Best Practices

- Always unsubscribe or use takeUntil
- Use shareReplay for caching
- Prefer switchMap for HTTP requests
- Handle errors at appropriate levels
- Use subjects sparingly

## Target Processes

- angular-enterprise-development
- real-time-features
- state-management-setup
- data-streaming
