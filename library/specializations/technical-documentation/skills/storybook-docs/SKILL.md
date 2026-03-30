---
name: storybook-docs
description: Storybook integration for UI component documentation. Configure docs addon, generate component documentation from stories, write MDX documentation, and integrate with design systems.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-017
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Storybook Documentation Skill

Generate comprehensive UI component documentation using Storybook with MDX, autodocs, and design system integration.

## Capabilities

- Configure Storybook docs addon
- Generate component documentation from stories
- Write MDX story documentation
- Configure autodocs for automatic documentation
- Integrate design system documentation
- Configure accessibility addon integration
- Export static documentation sites
- Integrate with Chromatic for visual testing

## Usage

Invoke this skill when you need to:
- Document React/Vue/Angular component libraries
- Create interactive component documentation
- Build design system documentation
- Generate API reference from component props
- Set up component playground documentation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectPath | string | Yes | Root path of the Storybook project |
| framework | string | No | react, vue, angular, web-components |
| outputDir | string | No | Static docs output directory |
| includeAccessibility | boolean | No | Include a11y addon docs |
| theme | string | No | docs theme (light, dark, custom) |
| generateMdx | boolean | No | Generate MDX documentation files |

### Input Example

```json
{
  "projectPath": "./packages/components",
  "framework": "react",
  "outputDir": "docs/components",
  "includeAccessibility": true,
  "generateMdx": true
}
```

## Output Structure

```
docs/components/
├── index.html                    # Documentation home
├── iframe.html                   # Story iframe
├── assets/
│   ├── manager.js
│   └── preview.js
├── sb-addons/                    # Addon assets
├── sb-common-assets/
├── sb-manager/
├── sb-preview/
└── stories.json                  # Story metadata
```

## Storybook Configuration

### .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag', // Generate docs for components with autodocs tag
    defaultName: 'Documentation',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
};

export default config;
```

### .storybook/preview.ts

```typescript
import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: themes.light,
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3',
        title: 'Table of Contents',
        disable: false,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
  },
  tags: ['autodocs'],
};

export default preview;
```

## Story Patterns

### Component Story Format (CSF3)

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

/**
 * Button component for user interactions.
 *
 * ## Usage
 * ```tsx
 * import { Button } from '@mylib/components';
 *
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 *
 * ## Accessibility
 * - Uses native button element for proper semantics
 * - Supports keyboard navigation
 * - Includes ARIA attributes for loading/disabled states
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Primary UI component for user interaction',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'ButtonVariant' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

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

/**
 * Secondary button for less prominent actions.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Danger button for destructive actions.
 * Use sparingly and with confirmation dialogs.
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use for destructive actions like delete or remove.',
      },
    },
  },
};

/**
 * Loading state with spinner.
 */
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Saving...',
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

/**
 * Size variants comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available size variants for different contexts.',
      },
    },
  },
};
```

### MDX Documentation

```mdx
{/* Button.mdx */}
import { Meta, Canvas, Controls, Stories, Story } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';
import { Button } from './Button';

<Meta of={ButtonStories} />

# Button

<Canvas of={ButtonStories.Primary} />

The Button component is used for triggering actions in forms, dialogs,
and throughout the interface.

## Import

```tsx
import { Button } from '@mylib/components';
```

## Usage

```tsx
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

## Props

<Controls />

## Variants

### Primary

Use the primary variant for the main action on a page.

<Canvas of={ButtonStories.Primary} />

### Secondary

Use secondary for less prominent actions.

<Canvas of={ButtonStories.Secondary} />

### Danger

Use danger variant for destructive actions. Always confirm with users.

<Canvas of={ButtonStories.Danger} />

## States

### Loading

Display a loading spinner when an action is in progress.

<Canvas of={ButtonStories.Loading} />

### Disabled

Disable buttons when actions are not available.

<Canvas of={ButtonStories.Disabled} />

## Sizes

<Canvas of={ButtonStories.Sizes} />

## Accessibility

- Uses semantic `<button>` element
- Supports keyboard focus and activation
- Includes `aria-disabled` when disabled
- Loading state announced to screen readers

## Design Guidelines

### Do

- Use clear, action-oriented labels
- Show loading state for async actions
- Disable when action is unavailable

### Don't

- Don't use for navigation (use Link)
- Don't stack multiple primary buttons
- Don't disable without explanation

## All Stories

<Stories />
```

## Autodocs Configuration

### Per-Component Autodocs

```typescript
// Component with JSDoc for autodocs
import { FC, ReactNode } from 'react';

export interface CardProps {
  /** Card title displayed in header */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Card content */
  children: ReactNode;
  /** Visual variant */
  variant?: 'elevated' | 'outlined' | 'filled';
  /** Whether card is interactive/clickable */
  interactive?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
}

/**
 * Card component for grouping related content.
 *
 * @example
 * ```tsx
 * <Card title="Welcome" variant="elevated">
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card: FC<CardProps> = ({
  title,
  subtitle,
  children,
  variant = 'elevated',
  interactive = false,
  onClick,
}) => {
  // Implementation
};
```

### Autodocs Customization

```typescript
// Card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Cards are surfaces that display content and actions on a single topic.

They should be easy to scan for relevant and actionable information.
Elements, like text and images, should be placed on them in a way
that clearly indicates hierarchy.
        `,
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Card content',
      table: {
        category: 'Content',
      },
    },
    title: {
      table: {
        category: 'Content',
      },
    },
    variant: {
      table: {
        category: 'Appearance',
      },
    },
    interactive: {
      table: {
        category: 'Behavior',
      },
    },
  },
};

export default meta;
```

## Design System Documentation

### Design Tokens MDX

```mdx
{/* DesignTokens.mdx */}
import { Meta, ColorPalette, ColorItem, Typeset } from '@storybook/blocks';

<Meta title="Foundations/Design Tokens" />

# Design Tokens

Design tokens are the visual design atoms of the design system.

## Colors

### Primary

<ColorPalette>
  <ColorItem
    title="Primary"
    subtitle="Brand colors"
    colors={{
      'Primary 50': '#E3F2FD',
      'Primary 100': '#BBDEFB',
      'Primary 500': '#2196F3',
      'Primary 700': '#1976D2',
      'Primary 900': '#0D47A1',
    }}
  />
</ColorPalette>

### Semantic

<ColorPalette>
  <ColorItem
    title="Success"
    colors={{ Success: '#4CAF50' }}
  />
  <ColorItem
    title="Warning"
    colors={{ Warning: '#FF9800' }}
  />
  <ColorItem
    title="Error"
    colors={{ Error: '#F44336' }}
  />
</ColorPalette>

## Typography

<Typeset
  fontSizes={['12px', '14px', '16px', '20px', '24px', '32px']}
  fontWeight={400}
  sampleText="The quick brown fox jumps over the lazy dog"
  fontFamily="Inter, system-ui, sans-serif"
/>
```

### Icons Documentation

```mdx
{/* Icons.mdx */}
import { Meta, IconGallery, IconItem } from '@storybook/blocks';
import * as Icons from '../icons';

<Meta title="Foundations/Icons" />

# Icons

Icon library for the design system.

<IconGallery>
  <IconItem name="Add"><Icons.Add /></IconItem>
  <IconItem name="Edit"><Icons.Edit /></IconItem>
  <IconItem name="Delete"><Icons.Delete /></IconItem>
  <IconItem name="Search"><Icons.Search /></IconItem>
  <IconItem name="Settings"><Icons.Settings /></IconItem>
</IconGallery>
```

## Accessibility Addon Integration

### A11y Configuration

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
  },
};

export default preview;
```

### Per-Story A11y

```typescript
export const AccessibleButton: Story = {
  args: {
    children: 'Submit Form',
    'aria-label': 'Submit the contact form',
  },
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

### Build Documentation

```bash
# Build static documentation site
npx storybook build --docs -o docs/components

# With custom output
npx storybook build --docs -o public/design-system
```

### package.json Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "build-docs": "storybook build --docs -o docs/components",
    "test-storybook": "test-storybook"
  }
}
```

## Workflow

1. **Analyze components** - Scan for React/Vue/Angular components
2. **Generate stories** - Create story files for components
3. **Extract props** - Use react-docgen for prop documentation
4. **Create MDX** - Generate MDX documentation pages
5. **Configure autodocs** - Set up automatic documentation
6. **Build static** - Export static documentation site

## Dependencies

```json
{
  "devDependencies": {
    "@storybook/react": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/addon-a11y": "^8.0.0",
    "@storybook/addon-interactions": "^8.0.0",
    "@storybook/addon-links": "^8.0.0",
    "@storybook/addon-designs": "^8.0.0",
    "@storybook/blocks": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "react-docgen-typescript": "^2.2.0"
  }
}
```

## Best Practices Applied

- Use CSF3 for story format
- Document props with JSDoc comments
- Include usage examples in MDX
- Group related args with table.category
- Add accessibility testing
- Include design guidelines
- Export static documentation

## References

- Storybook Docs: https://storybook.js.org/docs
- Storybook Addons: https://storybook.js.org/integrations
- MDX Documentation: https://storybook.js.org/docs/writing-docs/mdx
- Autodocs: https://storybook.js.org/docs/writing-docs/autodocs
- Chromatic: https://www.chromatic.com/

## Target Processes

- sdk-doc-generation.js
- interactive-tutorials.js
- how-to-guides.js
- docs-as-code-pipeline.js
