---
name: svelte
description: Svelte and SvelteKit development with built-in reactivity, stores, SSR/SSG, and modern web patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Svelte Skill

Expert assistance for building applications with Svelte and SvelteKit.

## Capabilities

- Create Svelte components with reactive declarations
- Implement Svelte stores for state management
- Configure SvelteKit for SSR/SSG/SPA
- Build API routes and form actions
- Set up load functions for data fetching
- Implement transitions and animations

## Usage

Invoke this skill when you need to:
- Build Svelte/SvelteKit applications
- Create reactive components
- Implement server-side rendering
- Set up form handling with actions
- Configure deployment

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentName | string | Yes | Component name |
| sveltekit | boolean | No | Using SvelteKit (default: true) |
| typescript | boolean | No | Use TypeScript (default: true) |
| ssr | boolean | No | Enable SSR (default: true) |

## Component Patterns

### Basic Component

```svelte
<!-- src/lib/components/UserCard.svelte -->
<script lang="ts">
  interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }

  export let user: User;
  export let editable = false;

  let isEditing = false;
  let editedName = user.name;

  // Reactive declaration
  $: initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  function save() {
    user = { ...user, name: editedName };
    isEditing = false;
  }
</script>

<div class="user-card">
  <div class="avatar">
    {#if user.avatar}
      <img src={user.avatar} alt={user.name} />
    {:else}
      <span class="initials">{initials}</span>
    {/if}
  </div>

  <div class="info">
    {#if isEditing}
      <input bind:value={editedName} on:keydown={(e) => e.key === 'Enter' && save()} />
      <button on:click={save}>Save</button>
      <button on:click={() => isEditing = false}>Cancel</button>
    {:else}
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {#if editable}
        <button on:click={() => { editedName = user.name; isEditing = true; }}>
          Edit
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .user-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
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

### Svelte Stores

```typescript
// src/lib/stores/user.ts
import { writable, derived, readable } from 'svelte/store';

interface User {
  id: string;
  name: string;
  email: string;
}

// Writable store
function createUserStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const user = await response.json();
      set(user);
    },
    logout: () => set(null),
    updateProfile: (data: Partial<User>) =>
      update(user => user ? { ...user, ...data } : null),
  };
}

export const user = createUserStore();

// Derived store
export const isAuthenticated = derived(user, $user => !!$user);

// Readable store (external data)
export const time = readable(new Date(), (set) => {
  const interval = setInterval(() => set(new Date()), 1000);
  return () => clearInterval(interval);
});
```

### SvelteKit Page with Load

```typescript
// src/routes/users/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const users = await db.user.findMany();

  return {
    users,
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const email = data.get('email') as string;

    if (!name || !email) {
      return fail(400, { error: 'Name and email required' });
    }

    const user = await db.user.create({
      data: { name, email },
    });

    return { success: true, user };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;

    await db.user.delete({ where: { id } });

    return { success: true };
  },
};
```

```svelte
<!-- src/routes/users/+page.svelte -->
<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
</script>

<h1>Users</h1>

{#if form?.error}
  <p class="error">{form.error}</p>
{/if}

<form method="POST" action="?/create" use:enhance>
  <input name="name" placeholder="Name" required />
  <input name="email" type="email" placeholder="Email" required />
  <button type="submit">Add User</button>
</form>

<ul>
  {#each data.users as user (user.id)}
    <li>
      {user.name} - {user.email}
      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={user.id} />
        <button type="submit">Delete</button>
      </form>
    </li>
  {/each}
</ul>
```

### API Routes

```typescript
// src/routes/api/users/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const search = url.searchParams.get('search');

  const users = await db.user.findMany({
    where: search ? { name: { contains: search } } : undefined,
  });

  return json(users);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  if (!body.name || !body.email) {
    throw error(400, 'Name and email required');
  }

  const user = await db.user.create({
    data: body,
  });

  return json(user, { status: 201 });
};
```

### Transitions and Animations

```svelte
<script>
  import { fade, fly, slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  let items = [];
  let showModal = false;
</script>

{#if showModal}
  <div class="modal" transition:fade={{ duration: 200 }}>
    <div class="content" in:fly={{ y: -50, duration: 300 }}>
      Modal content
    </div>
  </div>
{/if}

<ul>
  {#each items as item (item.id)}
    <li
      animate:flip={{ duration: 300 }}
      in:slide={{ duration: 200 }}
      out:fade={{ duration: 100 }}
    >
      {item.name}
    </li>
  {/each}
</ul>
```

## Best Practices

- Use reactive declarations ($:) for derived values
- Leverage SvelteKit's load functions for data
- Use form actions for mutations
- Keep stores simple and focused
- Use TypeScript for type safety

## Target Processes

- svelte-application-development
- sveltekit-full-stack
- jamstack-development
- frontend-architecture
