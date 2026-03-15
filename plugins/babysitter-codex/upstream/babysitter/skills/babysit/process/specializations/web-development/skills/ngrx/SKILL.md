---
name: ngrx
description: NgRx state management for Angular including store, effects, entity adapter, component store, and selectors.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# NgRx Skill

Expert assistance for implementing NgRx state management in Angular applications.

## Capabilities

- Configure NgRx store with feature states
- Create actions, reducers, and selectors
- Implement effects for side effects
- Use entity adapter for collections
- Apply component store for local state
- Set up NgRx DevTools integration

## Usage

Invoke this skill when you need to:
- Implement centralized state management
- Handle complex async workflows
- Manage normalized entity collections
- Debug state changes with DevTools
- Scale Angular application state

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| featureName | string | Yes | Feature state name |
| entityAdapter | boolean | No | Use entity adapter |
| effects | array | No | Effects to create |
| componentStore | boolean | No | Use component store |

### Configuration Example

```json
{
  "featureName": "users",
  "entityAdapter": true,
  "effects": ["loadUsers", "createUser", "updateUser"],
  "componentStore": false
}
```

## NgRx Patterns

### Actions

```typescript
// store/users/users.actions.ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const UsersActions = createActionGroup({
  source: 'Users',
  events: {
    'Load Users': emptyProps(),
    'Load Users Success': props<{ users: User[] }>(),
    'Load Users Failure': props<{ error: string }>(),

    'Create User': props<{ user: CreateUserDto }>(),
    'Create User Success': props<{ user: User }>(),
    'Create User Failure': props<{ error: string }>(),

    'Update User': props<{ id: string; changes: Partial<User> }>(),
    'Update User Success': props<{ user: User }>(),
    'Update User Failure': props<{ error: string }>(),

    'Delete User': props<{ id: string }>(),
    'Delete User Success': props<{ id: string }>(),
    'Delete User Failure': props<{ error: string }>(),

    'Select User': props<{ id: string | null }>(),
  },
});
```

### Reducer with Entity Adapter

```typescript
// store/users/users.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { UsersActions } from './users.actions';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UsersState extends EntityState<User> {
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const initialState: UsersState = usersAdapter.getInitialState({
  selectedId: null,
  loading: false,
  error: null,
});

export const usersReducer = createReducer(
  initialState,

  on(UsersActions.loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(UsersActions.loadUsersSuccess, (state, { users }) =>
    usersAdapter.setAll(users, { ...state, loading: false })
  ),

  on(UsersActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(UsersActions.createUserSuccess, (state, { user }) =>
    usersAdapter.addOne(user, state)
  ),

  on(UsersActions.updateUserSuccess, (state, { user }) =>
    usersAdapter.updateOne({ id: user.id, changes: user }, state)
  ),

  on(UsersActions.deleteUserSuccess, (state, { id }) =>
    usersAdapter.removeOne(id, state)
  ),

  on(UsersActions.selectUser, (state, { id }) => ({
    ...state,
    selectedId: id,
  }))
);
```

### Selectors

```typescript
// store/users/users.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { usersAdapter, UsersState } from './users.reducer';

export const selectUsersState = createFeatureSelector<UsersState>('users');

const { selectAll, selectEntities, selectIds, selectTotal } =
  usersAdapter.getSelectors();

export const selectAllUsers = createSelector(selectUsersState, selectAll);

export const selectUserEntities = createSelector(
  selectUsersState,
  selectEntities
);

export const selectUsersLoading = createSelector(
  selectUsersState,
  (state) => state.loading
);

export const selectUsersError = createSelector(
  selectUsersState,
  (state) => state.error
);

export const selectSelectedUserId = createSelector(
  selectUsersState,
  (state) => state.selectedId
);

export const selectSelectedUser = createSelector(
  selectUserEntities,
  selectSelectedUserId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

export const selectUsersCount = createSelector(selectUsersState, selectTotal);
```

### Effects

```typescript
// store/users/users.effects.ts
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, switchMap, of } from 'rxjs';
import { UsersActions } from './users.actions';
import { UsersService } from '../../services/users.service';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private usersService = inject(UsersService);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.loadUsers),
      switchMap(() =>
        this.usersService.getAll().pipe(
          map((users) => UsersActions.loadUsersSuccess({ users })),
          catchError((error) =>
            of(UsersActions.loadUsersFailure({ error: error.message }))
          )
        )
      )
    )
  );

  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.createUser),
      mergeMap(({ user }) =>
        this.usersService.create(user).pipe(
          map((user) => UsersActions.createUserSuccess({ user })),
          catchError((error) =>
            of(UsersActions.createUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.updateUser),
      mergeMap(({ id, changes }) =>
        this.usersService.update(id, changes).pipe(
          map((user) => UsersActions.updateUserSuccess({ user })),
          catchError((error) =>
            of(UsersActions.updateUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UsersActions.deleteUser),
      mergeMap(({ id }) =>
        this.usersService.delete(id).pipe(
          map(() => UsersActions.deleteUserSuccess({ id })),
          catchError((error) =>
            of(UsersActions.deleteUserFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
```

### Component Store (Local State)

```typescript
// components/user-list/user-list.store.ts
import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { switchMap, tap, catchError, EMPTY } from 'rxjs';

interface UserListState {
  users: User[];
  loading: boolean;
  filter: string;
}

@Injectable()
export class UserListStore extends ComponentStore<UserListState> {
  constructor(private usersService: UsersService) {
    super({
      users: [],
      loading: false,
      filter: '',
    });
  }

  // Selectors
  readonly users$ = this.select((state) => state.users);
  readonly loading$ = this.select((state) => state.loading);
  readonly filter$ = this.select((state) => state.filter);

  readonly filteredUsers$ = this.select(
    this.users$,
    this.filter$,
    (users, filter) =>
      users.filter((u) => u.name.toLowerCase().includes(filter.toLowerCase()))
  );

  // Updaters
  readonly setFilter = this.updater((state, filter: string) => ({
    ...state,
    filter,
  }));

  // Effects
  readonly loadUsers = this.effect((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ loading: true })),
      switchMap(() =>
        this.usersService.getAll().pipe(
          tap((users) => this.patchState({ users, loading: false })),
          catchError(() => {
            this.patchState({ loading: false });
            return EMPTY;
          })
        )
      )
    )
  );
}
```

### Store Setup

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { usersReducer } from './store/users/users.reducer';
import { UsersEffects } from './store/users/users.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({
      users: usersReducer,
    }),
    provideEffects(UsersEffects),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
    }),
  ],
};
```

## Best Practices

- Use createActionGroup for related actions
- Leverage entity adapter for collections
- Keep effects focused on single responsibilities
- Use component store for local state
- Create granular selectors for performance

## Target Processes

- angular-enterprise-development
- state-management-setup
- complex-data-flows
- enterprise-architecture
