---
name: vitest
description: Vitest configuration, mocking, coverage, snapshot testing, and performance.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Vitest Skill

Expert assistance for unit and integration testing with Vitest.

## Capabilities

- Configure Vitest for projects
- Write unit and integration tests
- Implement mocking strategies
- Configure coverage reporting
- Optimize test performance

## Test Patterns

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserService } from './user.service';

describe('UserService', () => {
  const mockDb = { user: { findMany: vi.fn() } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch users', async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: '1', name: 'John' }]);

    const service = new UserService(mockDb);
    const users = await service.findAll();

    expect(users).toHaveLength(1);
    expect(mockDb.user.findMany).toHaveBeenCalledOnce();
  });
});
```

## Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

## Target Processes

- unit-testing
- react-testing
- tdd-development
