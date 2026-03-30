# Angular Development Skill

Enterprise-grade Angular development with modern patterns, signals, and standalone components.

## Overview

This skill provides expertise in Angular development using the latest patterns including standalone components, signals, and modern dependency injection.

## When to Use

- Building enterprise Angular applications
- Implementing reactive forms
- Setting up routing with guards
- Using Angular signals
- Creating modular architecture

## Quick Start

```typescript
@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <button (click)="count.set(count() + 1)">
      Count: {{ count() }}
    </button>
  `,
})
export class CounterComponent {
  count = signal(0);
}
```

## Key Features

| Feature | Description |
|---------|-------------|
| Standalone | No NgModule required |
| Signals | Fine-grained reactivity |
| DI | Powerful dependency injection |
| Forms | Reactive and template-driven |

## Architecture

```
src/app/
├── components/      # Shared components
├── features/        # Feature modules
├── services/        # Injectable services
├── guards/          # Route guards
└── app.routes.ts    # Root routes
```

## Integration

Works with rxjs-skill and ngrx-skill for advanced state management.
