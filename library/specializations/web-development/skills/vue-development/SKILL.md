---
name: vue-development
description: Vue 3 development with Composition API, reactivity system, component patterns, TypeScript integration, and best practices.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Vue Development Skill

Expert assistance for building Vue 3 applications with Composition API and modern patterns.

## Capabilities

- Create Vue 3 components with Composition API
- Implement reactive state with ref and reactive
- Build composables for reusable logic
- Configure TypeScript with Vue
- Set up Vue Router and navigation guards
- Implement provide/inject for dependency injection

## Usage

Invoke this skill when you need to:
- Create Vue 3 components
- Build composables for shared logic
- Set up Vue project structure
- Implement reactive patterns
- Configure Vue with TypeScript

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentName | string | Yes | Component name (PascalCase) |
| compositionApi | boolean | No | Use Composition API (default: true) |
| typescript | boolean | No | Use TypeScript (default: true) |
| scriptSetup | boolean | No | Use script setup (default: true) |

### Configuration Example

```json
{
  "componentName": "UserProfile",
  "compositionApi": true,
  "typescript": true,
  "scriptSetup": true,
  "features": ["props", "emits", "slots"]
}
```

## Component Patterns

### Script Setup Component

```vue
<!-- components/UserProfile.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

// Props with defaults
const props = withDefaults(defineProps<{
  user: User;
  editable?: boolean;
}>(), {
  editable: false,
});

// Emits with typing
const emit = defineEmits<{
  update: [user: User];
  delete: [id: string];
}>();

// Reactive state
const isEditing = ref(false);
const editedName = ref(props.user.name);

// Computed
const initials = computed(() => {
  return props.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
});

// Methods
function saveChanges() {
  emit('update', { ...props.user, name: editedName.value });
  isEditing.value = false;
}

// Lifecycle
onMounted(() => {
  console.log('UserProfile mounted');
});

// Expose to parent
defineExpose({
  resetForm: () => {
    editedName.value = props.user.name;
    isEditing.value = false;
  },
});
</script>

<template>
  <div class="user-profile">
    <div class="avatar">
      <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
      <span v-else class="initials">{{ initials }}</span>
    </div>

    <div class="info">
      <template v-if="isEditing">
        <input v-model="editedName" @keyup.enter="saveChanges" />
        <button @click="saveChanges">Save</button>
        <button @click="isEditing = false">Cancel</button>
      </template>
      <template v-else>
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
        <button v-if="editable" @click="isEditing = true">Edit</button>
      </template>
    </div>

    <slot name="actions" :user="user" />
  </div>
</template>

<style scoped>
.user-profile {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
}

.initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #e5e7eb;
  font-weight: bold;
}
</style>
```

### Composable Pattern

```typescript
// composables/useUser.ts
import { ref, computed, readonly } from 'vue';

interface User {
  id: string;
  name: string;
  email: string;
}

export function useUser(userId: string) {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  async function fetchUser() {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      user.value = await response.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(data: Partial<User>) {
    if (!user.value) return;

    loading.value = true;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      user.value = await response.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    fetchUser,
    updateUser,
  };
}

// composables/useLocalStorage.ts
import { ref, watch } from 'vue';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const stored = localStorage.getItem(key);
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue);

  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    { deep: true }
  );

  return data;
}
```

### Provide/Inject Pattern

```typescript
// context/theme.ts
import { provide, inject, ref, type Ref, type InjectionKey } from 'vue';

type Theme = 'light' | 'dark';

interface ThemeContext {
  theme: Ref<Theme>;
  toggleTheme: () => void;
}

const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme');

export function provideTheme() {
  const theme = ref<Theme>('light');

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  provide(ThemeKey, { theme, toggleTheme });

  return { theme, toggleTheme };
}

export function useTheme() {
  const context = inject(ThemeKey);
  if (!context) {
    throw new Error('useTheme must be used within a theme provider');
  }
  return context;
}
```

### Vue Router Setup

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/Home.vue'),
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
```

## Best Practices

- Use script setup for cleaner components
- Create composables for reusable logic
- Type props and emits properly
- Use readonly for exposed reactive state
- Leverage provide/inject for deep dependency passing

## Target Processes

- vue-application-development
- vue-component-library
- nuxt-full-stack
- frontend-architecture
