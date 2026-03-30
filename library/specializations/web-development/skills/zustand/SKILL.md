---
name: zustand
description: Zustand state management patterns including store creation, middleware, persistence, slices, and DevTools integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Zustand Skill

Expert assistance for implementing Zustand state management with modern patterns and TypeScript.

## Capabilities

- Create type-safe Zustand stores
- Implement middleware (persist, devtools, immer)
- Design store slices for modular state
- Optimize selectors for performance
- Handle async actions and subscriptions
- Integrate with React components efficiently

## Usage

Invoke this skill when you need to:
- Set up lightweight global state
- Create stores with persistence
- Implement complex state with slices
- Optimize component re-renders with selectors
- Migrate from Redux or Context

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeName | string | Yes | Name of the store |
| stateShape | object | Yes | Initial state structure |
| actions | array | Yes | Store actions to create |
| middleware | array | No | Middleware to apply |
| persist | boolean | No | Enable persistence |

### Configuration Example

```json
{
  "storeName": "useCartStore",
  "stateShape": {
    "items": [],
    "total": 0
  },
  "actions": ["addItem", "removeItem", "clearCart"],
  "middleware": ["devtools", "persist"],
  "persist": true
}
```

## Generated Patterns

### Basic Store

```typescript
import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  total: 0,

  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
          total: state.total + item.price,
        };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }],
        total: state.total + item.price,
      };
    }),

  removeItem: (id) =>
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      return {
        items: state.items.filter((i) => i.id !== id),
        total: state.total - (item ? item.price * item.quantity : 0),
      };
    }),

  updateQuantity: (id, quantity) =>
    set((state) => {
      const item = state.items.find((i) => i.id === id);
      if (!item) return state;
      const diff = (quantity - item.quantity) * item.price;
      return {
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        ),
        total: state.total + diff,
      };
    }),

  clearCart: () => set({ items: [], total: 0 }),
}));
```

### Store with Middleware

```typescript
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface UserStore {
  user: User | null;
  preferences: Preferences;
  setUser: (user: User) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          user: null,
          preferences: { theme: 'light', notifications: true },

          setUser: (user) =>
            set((state) => {
              state.user = user;
            }),

          updatePreferences: (prefs) =>
            set((state) => {
              Object.assign(state.preferences, prefs);
            }),

          logout: () =>
            set((state) => {
              state.user = null;
            }),
        }))
      ),
      {
        name: 'user-storage',
        partialize: (state) => ({ preferences: state.preferences }),
      }
    ),
    { name: 'UserStore' }
  )
);
```

### Slice Pattern

```typescript
import { create, StateCreator } from 'zustand';

interface AuthSlice {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

interface UISlice {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

type StoreState = AuthSlice & UISlice;

const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set) => ({
  isAuthenticated: false,
  token: null,
  login: (token) => set({ isAuthenticated: true, token }),
  logout: () => set({ isAuthenticated: false, token: null }),
});

const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
});

export const useAppStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUISlice(...a),
}));
```

### Async Actions

```typescript
import { create } from 'zustand';

interface DataStore {
  data: Item[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  data: [],
  loading: false,
  error: null,

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      set({ data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
```

## Selector Patterns

```typescript
// Shallow comparison for object selectors
import { shallow } from 'zustand/shallow';

const { items, total } = useCartStore(
  (state) => ({ items: state.items, total: state.total }),
  shallow
);

// Computed selectors
const itemCount = useCartStore((state) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)
);
```

## Best Practices

- Use selectors to minimize re-renders
- Apply persist middleware for state that should survive refreshes
- Use immer for complex nested updates
- Split large stores into slices
- Keep actions colocated with state

## Target Processes

- react-application-development
- state-management-setup
- nextjs-full-stack
- t3-stack-development
