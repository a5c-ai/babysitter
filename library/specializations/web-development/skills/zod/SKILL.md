---
name: zod
description: Zod schema validation and type inference.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Zod Skill

Expert assistance for Zod schema validation.

## Capabilities

- Create Zod schemas
- Infer TypeScript types
- Handle transformations
- Validate forms
- Parse API responses

## Schema Patterns

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  createdAt: z.coerce.date(),
});

type User = z.infer<typeof UserSchema>;

// Parsing
const user = UserSchema.parse(data);

// Safe parsing
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error);
}
```

## Target Processes

- form-validation
- api-validation
- type-inference
