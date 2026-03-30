---
name: storybook
description: Storybook configuration, stories, addons, interaction testing, and documentation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Storybook Skill

Expert assistance for component development with Storybook.

## Capabilities

- Configure Storybook
- Write component stories
- Add interaction testing
- Configure addons
- Generate documentation

## Story Patterns

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

export const WithInteraction: Story = {
  args: { children: 'Click me' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  },
};
```

## Target Processes

- component-library
- design-system
- documentation
