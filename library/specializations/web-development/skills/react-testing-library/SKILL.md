---
name: react-testing-library
description: React Testing Library patterns, queries, user events, and accessibility testing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:react-testing, skill-area:component-testing]
  roles: [role:frontend-engineer, role:qa-engineer]
  topics: [topic:test-driven-development]

---

# React Testing Library Skill

Expert assistance for testing React components.

## Capabilities

- Write user-centric tests
- Use proper queries
- Handle async operations
- Test accessibility
- Mock dependencies

## Test Patterns

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

## Query Priority

1. getByRole (accessibility)
2. getByLabelText (forms)
3. getByPlaceholderText
4. getByText
5. getByTestId (last resort)

## Target Processes

- react-testing
- unit-testing
- accessibility-testing
