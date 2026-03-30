# Redux Toolkit Skill

Modern Redux development with Redux Toolkit for scalable state management in React applications.

## Overview

This skill provides expertise in Redux Toolkit, the official recommended approach for Redux development, including slices, async thunks, RTK Query, and entity adapters.

## When to Use

- Setting up Redux in new projects
- Creating feature slices
- Implementing async data fetching
- Configuring RTK Query endpoints
- Managing normalized state

## Key Features

### Slice Creation

```typescript
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded(state, action) {
      state.push(action.payload);
    },
  },
});
```

### RTK Query

```typescript
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getTodos: builder.query({ query: () => 'todos' }),
  }),
});
```

## Benefits

| Feature | Benefit |
|---------|---------|
| createSlice | Automatic action creators and immutable updates |
| createAsyncThunk | Simplified async handling with loading states |
| RTK Query | Built-in caching, refetching, and normalization |
| Entity Adapter | Normalized state management |

## Integration

Works with react-development-skill for comprehensive React/Redux applications.
