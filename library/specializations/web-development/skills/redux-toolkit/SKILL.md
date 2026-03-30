---
name: redux-toolkit
description: Redux Toolkit patterns including slice creation, async thunks, RTK Query, state normalization, and DevTools integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Redux Toolkit Skill

Expert assistance for implementing Redux Toolkit in React applications with modern patterns and best practices.

## Capabilities

- Create Redux slices with reducers and actions
- Implement async operations with createAsyncThunk
- Set up RTK Query for data fetching
- Configure state normalization with createEntityAdapter
- Integrate Redux DevTools and middleware
- Type Redux state and actions with TypeScript

## Usage

Invoke this skill when you need to:
- Set up Redux Toolkit in a new project
- Create feature slices with typed state
- Implement async data fetching
- Configure RTK Query endpoints
- Migrate from legacy Redux

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| featureName | string | Yes | Name of the feature/slice |
| stateShape | object | Yes | Initial state structure |
| asyncActions | array | No | Async thunks to create |
| useRTKQuery | boolean | No | Whether to use RTK Query |
| entityAdapter | boolean | No | Use entity adapter for normalization |

### Configuration Example

```json
{
  "featureName": "users",
  "stateShape": {
    "items": [],
    "selectedId": null,
    "status": "idle",
    "error": null
  },
  "asyncActions": ["fetchUsers", "createUser", "updateUser"],
  "useRTKQuery": false,
  "entityAdapter": true
}
```

## Generated Patterns

### Slice with Entity Adapter

```typescript
import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

interface User {
  id: string;
  name: string;
  email: string;
}

const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

interface UsersState extends ReturnType<typeof usersAdapter.getInitialState> {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UsersState = usersAdapter.getInitialState({
  status: 'idle',
  error: null,
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    userAdded: usersAdapter.addOne,
    userUpdated: usersAdapter.updateOne,
    userRemoved: usersAdapter.removeOne,
    usersReceived: usersAdapter.setAll,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        usersAdapter.setAll(state, action.payload);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch users';
      });
  },
});

export const { userAdded, userUpdated, userRemoved, usersReceived } = usersSlice.actions;

export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors<RootState>((state) => state.users);

export default usersSlice.reducer;
```

### Async Thunk

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { usersApi } from '../api/users.api';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersApi.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserDto, { rejectWithValue }) => {
    try {
      const response = await usersApi.create(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### RTK Query API

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface User {
  id: string;
  name: string;
  email: string;
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User' as const, id })), 'User']
          : ['User'],
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: 'users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, Partial<User> & Pick<User, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = usersApi;
```

## Store Configuration

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import usersReducer from '../features/users/usersSlice';
import { usersApi } from '../features/users/usersApi';

export const store = configureStore({
  reducer: {
    users: usersReducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(usersApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Best Practices

- Use RTK Query for server state, slices for client state
- Normalize nested data with createEntityAdapter
- Type all state and actions properly
- Use selectors for derived state
- Keep slices focused on single features

## Target Processes

- react-application-development
- state-management-setup
- mern-stack-development
- enterprise-react-development
