---
name: css-modules
description: CSS Modules patterns, composition, variables, and build configuration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CSS Modules Skill

Expert assistance for scoped styling with CSS Modules.

## Capabilities

- Configure CSS Modules
- Write scoped styles
- Implement composition
- Use CSS variables
- Handle theming

## Usage Pattern

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  composes: reset from './reset.module.css';
}

.primary {
  composes: button;
  background: var(--color-primary);
  color: white;
}
```

```tsx
import styles from './Button.module.css';

<button className={styles.primary}>Click me</button>
```

## Target Processes

- react-application-development
- component-styling
- design-system
