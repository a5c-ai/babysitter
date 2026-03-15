# Tailwind CSS Skill

Expert assistance for Tailwind CSS configuration, custom design systems, plugin development, and component styling patterns.

## Overview

This skill provides specialized guidance for Tailwind CSS, covering configuration, theming, custom plugins, and component patterns. It helps create maintainable, scalable design systems with Tailwind.

## When to Use

- Setting up Tailwind CSS in a project
- Creating a custom design system
- Implementing dark mode and theming
- Building component variants
- Developing custom Tailwind plugins
- Optimizing production builds

## Quick Start

### Basic Setup

```json
{
  "framework": "nextjs",
  "features": ["dark-mode", "typography"]
}
```

### Full Design System

```json
{
  "framework": "nextjs",
  "features": ["dark-mode", "typography", "forms", "animations"],
  "designTokens": {
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981"
    }
  },
  "plugins": ["@tailwindcss/typography", "@tailwindcss/forms"]
}
```

## Generated Structure

```
project/
├── tailwind.config.ts        # Configuration
├── postcss.config.js         # PostCSS setup
├── app/globals.css           # Global styles
├── lib/
│   └── utils.ts              # cn() utility
└── components/ui/
    ├── button.tsx            # Component variants
    └── card.tsx
```

## Features

### CSS Variables for Theming

```css
/* globals.css */
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

### Component Variants with CVA

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

### Utility Function

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn('base-class', condition && 'conditional-class', className)} />
```

### Dark Mode

```typescript
// Theme Provider
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>

// Theme Toggle
const { theme, setTheme } = useTheme();
setTheme(theme === 'dark' ? 'light' : 'dark');
```

### Custom Plugin

```typescript
import plugin from 'tailwindcss/plugin';

export const customPlugin = plugin(({ addUtilities }) => {
  addUtilities({
    '.text-shadow': {
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
  });
});
```

## Common Patterns

### Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Hover and Focus States

```tsx
<button className="bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click me
</button>
```

### Animations

```tsx
<div className="animate-fade-in">
  {/* Animated content */}
</div>

// In tailwind.config.ts
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
},
```

### Container Queries

```tsx
<div className="@container">
  <div className="@lg:flex @lg:gap-4">
    {/* Responds to container size */}
  </div>
</div>
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| design-system-setup | Primary styling skill |
| component-styling | Variant patterns |
| theming-dark-mode | Theme implementation |
| responsive-design | Mobile-first patterns |
| accessibility-styling | Focus states |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| darkMode | class | Dark mode strategy |
| content | auto | Content paths for purging |
| prefix | none | Class name prefix |

## Best Practices

1. **CSS Variables**: Use for dynamic theming
2. **Component Classes**: Extract with @apply sparingly
3. **Utility First**: Prefer utilities over custom CSS
4. **Tailwind Merge**: Use cn() to avoid conflicts
5. **Semantic Colors**: Name by purpose, not value

## Dependencies

```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "@tailwindcss/typography": "^0.5.0",
    "@tailwindcss/forms": "^0.5.0",
    "tailwindcss-animate": "^1.0.0"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0"
  }
}
```

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Class Variance Authority](https://cva.style/docs)
- [Tailwind Merge](https://github.com/dcastil/tailwind-merge)
- [Tailwind CSS v4 Guide](https://tailwindcss.com/blog/tailwindcss-v4)
