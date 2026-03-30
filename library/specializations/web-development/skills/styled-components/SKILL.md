---
name: styled-components
description: Styled Components theming, variants, SSR support, and patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Styled Components Skill

Expert assistance for CSS-in-JS with styled-components.

## Capabilities

- Create styled components
- Implement theming
- Handle SSR
- Create variants
- Extend components

## Patterns

```typescript
import styled, { css } from 'styled-components';

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;

  ${({ $variant }) =>
    $variant === 'primary' &&
    css`
      background: ${({ theme }) => theme.colors.primary};
      color: white;
    `}
`;

// Theming
const theme = {
  colors: { primary: '#3b82f6' },
};

<ThemeProvider theme={theme}>
  <Button $variant="primary">Click me</Button>
</ThemeProvider>
```

## Target Processes

- react-application-development
- theming-implementation
- component-library
