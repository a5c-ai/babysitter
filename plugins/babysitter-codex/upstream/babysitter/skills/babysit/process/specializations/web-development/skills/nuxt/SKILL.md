---
name: nuxt
description: Nuxt 3 patterns including Nitro server, auto-imports, modules, hybrid rendering, and full-stack development.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Nuxt Skill

Expert assistance for building full-stack applications with Nuxt 3.

## Capabilities

- Configure Nuxt 3 projects with TypeScript
- Implement hybrid rendering (SSR, SSG, ISR, SPA)
- Build Nitro server routes and middleware
- Create composables with auto-imports
- Set up Nuxt modules and plugins
- Configure deployment for various platforms

## Usage

Invoke this skill when you need to:
- Create Nuxt 3 full-stack applications
- Implement server-side rendering
- Build API routes with Nitro
- Configure rendering modes
- Deploy Nuxt applications

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectType | string | Yes | fullstack, static, spa |
| rendering | string | No | ssr, ssg, isr, spa |
| modules | array | No | Nuxt modules to include |
| features | array | No | auth, i18n, pwa, etc. |

### Configuration Example

```json
{
  "projectType": "fullstack",
  "rendering": "ssr",
  "modules": ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@vueuse/nuxt"],
  "features": ["auth", "api"]
}
```

## Project Structure

```
nuxt-app/
├── .nuxt/                  # Build directory
├── assets/                 # Uncompiled assets
├── components/             # Auto-imported components
│   ├── base/
│   │   └── Button.vue     # <BaseButton />
│   └── TheHeader.vue      # <TheHeader />
├── composables/            # Auto-imported composables
│   ├── useAuth.ts
│   └── useFetch.ts
├── layouts/                # Page layouts
│   ├── default.vue
│   └── auth.vue
├── middleware/             # Route middleware
│   └── auth.ts
├── pages/                  # File-based routing
│   ├── index.vue          # /
│   ├── about.vue          # /about
│   └── users/
│       ├── index.vue      # /users
│       └── [id].vue       # /users/:id
├── plugins/                # Vue plugins
│   └── api.ts
├── public/                 # Static files
├── server/                 # Nitro server
│   ├── api/
│   │   └── users/
│   │       ├── index.ts   # /api/users
│   │       └── [id].ts    # /api/users/:id
│   ├── middleware/
│   │   └── auth.ts
│   └── utils/
│       └── db.ts
├── stores/                 # Pinia stores
│   └── user.ts
├── nuxt.config.ts
└── app.vue
```

## Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  runtimeConfig: {
    // Server-only
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,

    // Client-exposed
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/api/**': { cors: true },
    '/dashboard/**': { ssr: false },
    '/blog/**': { isr: 3600 },
  },

  nitro: {
    preset: 'vercel',
  },
});
```

## Server API Routes

```typescript
// server/api/users/index.ts
export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    const query = getQuery(event);
    return await db.user.findMany({
      where: query.search
        ? { name: { contains: query.search as string } }
        : undefined,
    });
  }

  if (method === 'POST') {
    const body = await readBody(event);
    return await db.user.create({ data: body });
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});

// server/api/users/[id].ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (method === 'GET') {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      throw createError({ statusCode: 404, message: 'User not found' });
    }
    return user;
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    return await db.user.update({ where: { id }, data: body });
  }

  if (method === 'DELETE') {
    await db.user.delete({ where: { id } });
    return { success: true };
  }
});
```

## Server Middleware

```typescript
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const protectedPaths = ['/api/users', '/api/posts'];
  const path = event.path;

  if (protectedPaths.some((p) => path.startsWith(p))) {
    const token = getHeader(event, 'authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    try {
      const user = await verifyToken(token);
      event.context.user = user;
    } catch {
      throw createError({ statusCode: 401, message: 'Invalid token' });
    }
  }
});
```

## Pages and Layouts

```vue
<!-- pages/users/[id].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: user, pending, error } = await useFetch(
  `/api/users/${route.params.id}`
);

useHead({
  title: () => user.value?.name ?? 'User',
});

definePageMeta({
  layout: 'default',
  middleware: 'auth',
});
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">{{ error.message }}</div>
    <div v-else>
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    </div>
  </div>
</template>

<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen">
    <TheHeader />
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>
```

## Composables

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState<User | null>('user', () => null);
  const token = useCookie('auth-token');

  const isAuthenticated = computed(() => !!user.value);

  async function login(email: string, password: string) {
    const { data } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (data.value) {
      user.value = data.value.user;
      token.value = data.value.token;
    }
  }

  async function logout() {
    user.value = null;
    token.value = null;
    await navigateTo('/login');
  }

  async function fetchUser() {
    if (!token.value) return;

    const { data } = await useFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` },
    });

    user.value = data.value;
  }

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    fetchUser,
  };
};
```

## Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }
});

// middleware/guest.ts
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated.value) {
    return navigateTo('/dashboard');
  }
});
```

## Best Practices

- Use auto-imports for cleaner code
- Leverage Nitro for API routes
- Configure route rules for optimal rendering
- Use useFetch/useAsyncData for data fetching
- Organize components with folder naming convention

## Target Processes

- nuxt-full-stack
- vue-ssr-application
- jamstack-development
- api-development
