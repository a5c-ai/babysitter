# Svelte Skill

Svelte and SvelteKit development with built-in reactivity and modern web patterns.

## Overview

This skill provides expertise in Svelte, a compiler-based framework that produces highly optimized vanilla JavaScript, and SvelteKit for full-stack development.

## When to Use

- Building highly performant web apps
- Creating reactive UIs with minimal boilerplate
- Full-stack development with SvelteKit
- Form handling with progressive enhancement
- Static site generation

## Quick Start

```svelte
<script>
  let count = 0;
  $: doubled = count * 2;
</script>

<button on:click={() => count++}>
  Count: {count}, Doubled: {doubled}
</button>
```

## Key Features

| Feature | Description |
|---------|-------------|
| Reactivity | Compile-time reactive declarations |
| No Virtual DOM | Direct DOM manipulation |
| Stores | Built-in state management |
| Transitions | Built-in animations |
| SvelteKit | Full-stack framework |

## SvelteKit Structure

```
src/
├── routes/
│   ├── +page.svelte
│   ├── +page.server.ts
│   └── api/+server.ts
└── lib/
    ├── components/
    └── stores/
```

## Integration

SvelteKit provides its own routing and data loading patterns.
