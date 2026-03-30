# Remix Skill

Full-stack React framework with focus on web fundamentals and progressive enhancement.

## Overview

This skill provides expertise in Remix, a full-stack web framework that embraces web standards and provides excellent developer and user experience.

## When to Use

- Building full-stack React applications
- Implementing progressive enhancement
- Creating nested route layouts
- Handling forms properly
- Edge deployment requirements

## Quick Start

```typescript
// app/routes/hello.tsx
export async function loader() {
  return json({ message: 'Hello, World!' });
}

export default function Hello() {
  const { message } = useLoaderData<typeof loader>();
  return <h1>{message}</h1>;
}
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| Loader | Server-side data fetching |
| Action | Server-side mutations |
| Form | Progressive enhancement |
| Outlet | Nested route rendering |

## Route Structure

```
app/routes/
├── _index.tsx         # /
├── about.tsx          # /about
├── users.tsx          # /users (layout)
├── users._index.tsx   # /users (index)
└── users.$id.tsx      # /users/:id
```

## Form Handling

```tsx
<Form method="post">
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</Form>
```

## Integration

Remix provides its own patterns for data loading and mutations.
