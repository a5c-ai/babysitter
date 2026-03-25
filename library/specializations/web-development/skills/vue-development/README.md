# Vue Development Skill

Vue 3 development with Composition API for building modern, reactive applications.

## Overview

This skill provides expertise in Vue 3 development using the Composition API, offering guidance on components, composables, reactivity, and TypeScript integration.

## When to Use

- Building Vue 3 applications
- Creating reusable composables
- Implementing reactive patterns
- Setting up Vue Router
- TypeScript integration with Vue

## Quick Start

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>

<template>
  <button @click="count++">
    Count: {{ count }} (doubled: {{ doubled }})
  </button>
</template>
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| ref | Reactive primitive values |
| reactive | Reactive objects |
| computed | Derived values |
| watch | Side effects on changes |
| composables | Reusable logic extraction |

## Composition API vs Options API

```vue
<!-- Composition API (recommended) -->
<script setup>
const count = ref(0);
</script>

<!-- Options API -->
<script>
export default {
  data() {
    return { count: 0 };
  },
};
</script>
```

## Integration

Works with pinia-skill for state management and nuxt-skill for full-stack development.
