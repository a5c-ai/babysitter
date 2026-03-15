---
name: shadcn
description: shadcn/ui component patterns, customization, theming, and integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# shadcn/ui Skill

Expert assistance for building UIs with shadcn/ui components.

## Capabilities

- Install and configure components
- Customize component styles
- Implement theming
- Extend components
- Integrate with forms

## Usage Pattern

```bash
npx shadcn-ui@latest add button dialog form
```

```tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Theming

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}
```

## Target Processes

- react-application-development
- nextjs-full-stack
- rapid-prototyping
