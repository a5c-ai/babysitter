# React Testing Library Skill

Testing React components the way users interact with them.

## Overview

React Testing Library encourages better testing practices with user-centric queries.

## When to Use

- React component testing
- Accessibility verification
- Integration testing
- User interaction testing

## Query Priority

```typescript
// Preferred
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);

// Avoid
screen.getByTestId('submit-button');
```

## Integration

Works with vitest-skill or jest-skill for test running.
