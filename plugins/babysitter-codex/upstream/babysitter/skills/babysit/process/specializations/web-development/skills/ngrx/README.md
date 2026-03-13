# NgRx Skill

Enterprise state management for Angular with NgRx, featuring Redux patterns and RxJS integration.

## Overview

This skill provides expertise in NgRx, the reactive state management library for Angular applications, implementing the Redux pattern with RxJS.

## When to Use

- Enterprise Angular applications
- Complex state management needs
- Time-travel debugging requirements
- Team collaboration on state
- Predictable state updates

## Quick Start

```typescript
// Actions
export const loadUsers = createAction('[Users] Load');

// Reducer
export const usersReducer = createReducer(
  initialState,
  on(loadUsers, state => ({ ...state, loading: true }))
);

// Selector
export const selectUsers = createSelector(
  selectState,
  state => state.users
);
```

## Key Concepts

| Concept | Purpose |
|---------|---------|
| Store | Single source of truth |
| Actions | Events describing state changes |
| Reducers | Pure functions for state transitions |
| Effects | Side effects handling |
| Selectors | Derived state queries |

## Data Flow

```
Component -> Action -> Reducer -> Store -> Selector -> Component
                         |
                      Effects -> API
```

## Integration

Works with angular-development-skill and rxjs-skill for complete Angular state management.
