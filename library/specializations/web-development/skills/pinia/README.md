# Pinia Skill

Modern state management for Vue 3 with Pinia, offering intuitive API and excellent TypeScript support.

## Overview

This skill provides expertise in Pinia, the official state management solution for Vue 3, featuring a simple API, DevTools support, and full TypeScript integration.

## When to Use

- Managing global state in Vue applications
- Building type-safe stores
- Persisting state to storage
- Composing multiple stores
- Migrating from Vuex

## Quick Start

```typescript
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    doubled: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
  },
});
```

## Store Styles

| Style | Best For |
|-------|----------|
| Options | Simple stores, Vuex migration |
| Setup | Complex logic, better TypeScript |

## Setup Store Example

```typescript
export const useStore = defineStore('name', () => {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
  function increment() { count.value++; }
  return { count, doubled, increment };
});
```

## Integration

Works with vue-development-skill and nuxt-skill for complete Vue application development.
