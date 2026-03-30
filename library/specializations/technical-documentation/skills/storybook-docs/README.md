# Storybook Documentation Skill

Generate interactive UI component documentation using Storybook with MDX, autodocs, and design system integration.

## Overview

This skill provides expertise in Storybook configuration for component documentation. It supports React, Vue, Angular, and Web Components, with features for autodocs generation, MDX documentation, accessibility testing, and design system documentation.

## When to Use

- Documenting React/Vue/Angular component libraries
- Creating interactive component playgrounds
- Building design system documentation
- Generating prop documentation automatically
- Setting up component documentation pipelines

## Quick Start

### Basic Setup

```json
{
  "projectPath": "./packages/components",
  "framework": "react",
  "includeAccessibility": true
}
```

### With Static Export

```json
{
  "projectPath": "./packages/ui",
  "framework": "react",
  "outputDir": "docs/components",
  "generateMdx": true
}
```

## Story Format (CSF3)

### Basic Story

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Click me',
  },
};
```

### With Documentation

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

/**
 * Button component for user interactions.
 *
 * ## Usage
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Primary UI component for user interaction',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    onClick: {
      action: 'clicked',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button for main actions.
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};
```

## MDX Documentation

### Component Documentation

```mdx
{/* Button.mdx */}
import { Meta, Canvas, Controls, Stories } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

<Canvas of={ButtonStories.Primary} />

The Button component triggers actions in forms and interfaces.

## Import

```tsx
import { Button } from '@mylib/components';
```

## Props

<Controls />

## Variants

<Canvas of={ButtonStories.Primary} />
<Canvas of={ButtonStories.Secondary} />

## All Stories

<Stories />
```

### Design Tokens

```mdx
import { Meta, ColorPalette, ColorItem, Typeset } from '@storybook/blocks';

<Meta title="Foundations/Colors" />

# Colors

<ColorPalette>
  <ColorItem
    title="Primary"
    colors={{
      'Primary 500': '#2196F3',
      'Primary 700': '#1976D2',
    }}
  />
</ColorPalette>
```

## Configuration

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    docs: {
      toc: true, // Table of contents
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
```

## Prop Documentation

### Component with JSDoc

```typescript
export interface ButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disables the button */
  disabled?: boolean;
  /** Shows loading spinner */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Button content */
  children: ReactNode;
}

/**
 * Button component for user interactions.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */
export const Button: FC<ButtonProps> = (props) => {
  // Implementation
};
```

## Accessibility

### A11y Addon Configuration

```typescript
// .storybook/preview.ts
const preview: Preview = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
};
```

### Per-Story A11y

```typescript
export const Accessible: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
};
```

## Static Export

### Build Commands

```bash
# Build full Storybook
npx storybook build -o storybook-static

# Build docs-only
npx storybook build --docs -o docs/components
```

### package.json

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "build-docs": "storybook build --docs -o docs"
  }
}
```

## Process Integration

| Process | Usage |
|---------|-------|
| `sdk-doc-generation.js` | Component library docs |
| `interactive-tutorials.js` | Interactive examples |
| `how-to-guides.js` | Usage guides |
| `docs-as-code-pipeline.js` | CI/CD integration |

## CI/CD Integration

### GitHub Actions

```yaml
name: Storybook

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build-docs
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### Chromatic Integration

```yaml
- name: Publish to Chromatic
  uses: chromaui/action@latest
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Best Practices

1. **Use CSF3 format** for stories
2. **Document props** with JSDoc comments
3. **Include usage examples** in descriptions
4. **Add accessibility testing** with a11y addon
5. **Group args** with table.category
6. **Create design token pages** for design systems
7. **Export static docs** for deployment

## References

- [Storybook Docs](https://storybook.js.org/docs)
- [Writing Stories](https://storybook.js.org/docs/writing-stories)
- [MDX Documentation](https://storybook.js.org/docs/writing-docs/mdx)
- [Autodocs](https://storybook.js.org/docs/writing-docs/autodocs)
- [Accessibility Testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-017
**Category:** Component Documentation
**Status:** Active
