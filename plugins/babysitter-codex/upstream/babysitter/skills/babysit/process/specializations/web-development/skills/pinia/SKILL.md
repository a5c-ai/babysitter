---
name: pinia
description: Pinia state management for Vue 3 including store creation, actions, getters, plugins, and DevTools integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Pinia Skill

Expert assistance for implementing Pinia state management in Vue 3 applications.

## Capabilities

- Create type-safe Pinia stores
- Implement actions for async operations
- Define getters for computed state
- Configure Pinia plugins (persistence, etc.)
- Set up store composition patterns
- Integrate with Vue DevTools

## Usage

Invoke this skill when you need to:
- Set up global state management in Vue
- Create feature-specific stores
- Implement persistent state
- Compose multiple stores
- Handle async state operations

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeName | string | Yes | Store name (use prefix) |
| stateShape | object | Yes | Initial state structure |
| actions | array | Yes | Store actions |
| getters | array | No | Computed getters |
| persist | boolean | No | Enable persistence |

### Configuration Example

```json
{
  "storeName": "useUserStore",
  "stateShape": {
    "user": null,
    "isAuthenticated": false
  },
  "actions": ["login", "logout", "fetchUser"],
  "getters": ["fullName", "isAdmin"],
  "persist": true
}
```

## Store Patterns

### Setup Store (Recommended)

```typescript
// stores/user.ts
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const fullName = computed(() => user.value?.name ?? 'Guest');

  // Actions
  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      user.value = data.user;
      localStorage.setItem('token', data.token);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    user.value = null;
    localStorage.removeItem('token');
  }

  async function fetchUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    loading.value = true;
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      user.value = await response.json();
    } catch (e) {
      logout();
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    fullName,
    // Actions
    login,
    logout,
    fetchUser,
  };
});
```

### Options Store

```typescript
// stores/cart.ts
import { defineStore } from 'pinia';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),

  getters: {
    totalItems: (state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),

    totalPrice: (state) =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),

    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    addItem(item: Omit<CartItem, 'quantity'>) {
      const existing = this.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity++;
      } else {
        this.items.push({ ...item, quantity: 1 });
      }
    },

    removeItem(id: string) {
      const index = this.items.findIndex((i) => i.id === id);
      if (index > -1) {
        this.items.splice(index, 1);
      }
    },

    updateQuantity(id: string, quantity: number) {
      const item = this.items.find((i) => i.id === id);
      if (item) {
        item.quantity = Math.max(0, quantity);
        if (item.quantity === 0) {
          this.removeItem(id);
        }
      }
    },

    clearCart() {
      this.items = [];
    },
  },
});
```

### Pinia Setup with Plugins

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.mount('#app');

// Store with persistence
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light',
    language: 'en',
  }),
  persist: true, // Persists to localStorage
});

// Custom persistence config
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
  }),
  persist: {
    key: 'user-store',
    storage: sessionStorage,
    paths: ['token'], // Only persist token
  },
});
```

### Store Composition

```typescript
// stores/checkout.ts
import { defineStore } from 'pinia';
import { useCartStore } from './cart';
import { useUserStore } from './user';

export const useCheckoutStore = defineStore('checkout', () => {
  const cart = useCartStore();
  const user = useUserStore();

  const canCheckout = computed(() => {
    return user.isAuthenticated && !cart.isEmpty;
  });

  async function processCheckout(paymentMethod: string) {
    if (!canCheckout.value) {
      throw new Error('Cannot checkout');
    }

    const order = {
      userId: user.user!.id,
      items: cart.items,
      total: cart.totalPrice,
      paymentMethod,
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });

    if (response.ok) {
      cart.clearCart();
    }

    return response.json();
  }

  return {
    canCheckout,
    processCheckout,
  };
});
```

### Usage in Components

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// Destructure with reactivity preserved
const { user, isAuthenticated, loading } = storeToRefs(userStore);

// Actions can be destructured directly
const { login, logout } = userStore;

async function handleLogin() {
  try {
    await login(email.value, password.value);
    router.push('/dashboard');
  } catch (e) {
    // Handle error
  }
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="isAuthenticated">
    Welcome, {{ user?.name }}
    <button @click="logout">Logout</button>
  </div>
  <LoginForm v-else @submit="handleLogin" />
</template>
```

## Best Practices

- Prefer setup stores for better TypeScript support
- Use storeToRefs for reactive destructuring
- Compose stores for complex features
- Keep stores focused on single concerns
- Use plugins for cross-cutting concerns

## Target Processes

- vue-application-development
- nuxt-full-stack
- state-management-setup
- frontend-architecture
