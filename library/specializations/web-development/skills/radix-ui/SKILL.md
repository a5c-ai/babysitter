---
name: radix-ui
description: Radix UI primitives, composition patterns, accessibility, and customization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Radix UI Skill

Expert assistance for building accessible components with Radix UI.

## Capabilities

- Use Radix primitives
- Compose accessible components
- Style with CSS/Tailwind
- Handle complex interactions
- Implement WAI-ARIA patterns

## Usage Pattern

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close asChild>
        <button>Close</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

## Target Processes

- component-library
- accessibility-implementation
- design-system
