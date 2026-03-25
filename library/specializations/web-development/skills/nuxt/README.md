# Nuxt Skill

Full-stack Vue development with Nuxt 3, featuring hybrid rendering and the Nitro server engine.

## Overview

This skill provides expertise in Nuxt 3, the intuitive Vue framework for building full-stack applications with SSR, SSG, and hybrid rendering capabilities.

## When to Use

- Building full-stack Vue applications
- Implementing server-side rendering
- Creating API routes with Nitro
- Deploying to edge platforms
- Static site generation

## Quick Start

```bash
npx nuxi init my-app
cd my-app
npm install
npm run dev
```

## Key Features

| Feature | Description |
|---------|-------------|
| Auto-imports | Components/composables automatically available |
| File routing | pages/ directory maps to routes |
| Nitro | Universal server engine |
| Hybrid rendering | Mix SSR, SSG, ISR per route |

## Directory Structure

```
├── components/    # Auto-imported
├── composables/   # Auto-imported
├── pages/         # File-based routing
├── server/api/    # Nitro API routes
└── nuxt.config.ts
```

## Route Rules

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
    '/blog/**': { isr: 3600 },
  },
});
```

## Integration

Works with vue-development-skill and pinia-skill for complete Vue ecosystem support.
