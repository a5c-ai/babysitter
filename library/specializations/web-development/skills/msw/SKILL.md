---
name: msw
description: Mock Service Worker API mocking, request handlers, and integration testing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:react-testing, skill-area:service-mocking]
  roles: [role:frontend-engineer, role:qa-engineer]
  topics: [topic:test-driven-development]

---

# MSW Skill

Expert assistance for API mocking with Mock Service Worker.

## Capabilities

- Create request handlers
- Mock REST and GraphQL APIs
- Handle network errors
- Integrate with tests
- Use in development

## Handlers

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body }, { status: 201 });
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'John' });
  }),
];
```

## Test Integration

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Target Processes

- api-mocking
- integration-testing
- frontend-development
