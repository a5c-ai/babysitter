---
name: tailwind-css
description: Tailwind CSS configuration, custom plugins, design systems, theming, and component patterns for modern web applications.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Tailwind CSS Skill

Expert assistance for Tailwind CSS configuration, custom design systems, plugin development, and component styling patterns.

## Capabilities

- Configure Tailwind CSS for various frameworks
- Create custom design tokens and themes
- Build reusable component patterns
- Develop custom Tailwind plugins
- Implement dark mode and theming
- Optimize production builds

## Usage

Invoke this skill when you need to:
- Set up Tailwind CSS in a project
- Create a custom design system
- Build component style patterns
- Implement theming and dark mode
- Optimize Tailwind configuration

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| framework | string | No | react, nextjs, vue, vanilla |
| features | array | No | dark-mode, custom-colors, typography, forms, animations |
| designTokens | object | No | Custom colors, spacing, fonts |
| plugins | array | No | Tailwind plugins to include |

### Configuration Example

```json
{
  "framework": "nextjs",
  "features": ["dark-mode", "typography", "forms", "animations"],
  "designTokens": {
    "colors": {
      "primary": "#3B82F6",
      "secondary": "#10B981"
    },
    "fontFamily": {
      "sans": "Inter",
      "mono": "JetBrains Mono"
    }
  },
  "plugins": ["@tailwindcss/typography", "@tailwindcss/forms"]
}
```

## Output Structure

```
project/
├── tailwind.config.ts          # Main configuration
├── postcss.config.js           # PostCSS configuration
├── app/
│   └── globals.css             # Global styles and layers
├── lib/
│   └── tailwind/
│       ├── plugins/
│       │   └── custom-plugin.ts
│       └── presets/
│           └── design-system.ts
└── components/
    └── ui/
        ├── button.tsx          # Component with variants
        └── card.tsx
```

## Generated Code Patterns

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [typography, forms, animate],
};

export default config;
```

### Global Styles

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-md text-sm font-medium
           transition-colors focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-ring focus-visible:ring-offset-2
           disabled:opacity-50 disabled:pointer-events-none;
  }

  .btn-primary {
    @apply btn bg-primary text-primary-foreground hover:bg-primary/90;
  }

  .btn-secondary {
    @apply btn bg-secondary text-secondary-foreground hover:bg-secondary/80;
  }

  .btn-outline {
    @apply btn border border-input bg-background hover:bg-accent
           hover:text-accent-foreground;
  }

  .btn-ghost {
    @apply btn hover:bg-accent hover:text-accent-foreground;
  }

  .input {
    @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2
           text-sm ring-offset-background file:border-0 file:bg-transparent
           file:text-sm file:font-medium placeholder:text-muted-foreground
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
           focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .card {
    @apply rounded-lg border bg-card text-card-foreground shadow-sm;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .animate-in {
    animation-duration: 150ms;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    animation-fill-mode: both;
  }

  .fade-in {
    animation-name: fadeIn;
  }

  .slide-in-from-top {
    --tw-enter-translate-y: -100%;
    animation-name: slideInFromTop;
  }
}
```

### Button Component with Variants

```typescript
// components/ui/button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Custom Plugin

```typescript
// lib/tailwind/plugins/custom-plugin.ts
import plugin from 'tailwindcss/plugin';

export const customPlugin = plugin(
  function ({ addUtilities, addComponents, matchUtilities, theme }) {
    // Add custom utilities
    addUtilities({
      '.text-shadow': {
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      '.text-shadow-md': {
        textShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
      },
      '.text-shadow-lg': {
        textShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
      },
      '.text-shadow-none': {
        textShadow: 'none',
      },
    });

    // Add custom components
    addComponents({
      '.skeleton': {
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        backgroundColor: theme('colors.muted'),
        borderRadius: theme('borderRadius.md'),
      },
    });

    // Add dynamic utilities
    matchUtilities(
      {
        'text-shadow': (value) => ({
          textShadow: value,
        }),
      },
      { values: theme('textShadow') }
    );
  },
  {
    theme: {
      textShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 4px rgba(0, 0, 0, 0.1)',
        md: '0 4px 8px rgba(0, 0, 0, 0.12)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
      },
    },
  }
);
```

### Utility Functions

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Dark Mode Implementation

### Theme Provider

```typescript
// components/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Theme Toggle

```typescript
// components/theme-toggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

## Dependencies

```json
{
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@tailwindcss/typography": "^0.5.0",
    "@tailwindcss/forms": "^0.5.0",
    "tailwindcss-animate": "^1.0.0"
  }
}
```

## Workflow

1. **Install Tailwind** - Set up with framework
2. **Configure theme** - Colors, fonts, spacing
3. **Create CSS layers** - Base, components, utilities
4. **Build components** - With variants using CVA
5. **Implement dark mode** - CSS variables + provider
6. **Optimize production** - Purge unused styles

## Best Practices Applied

- CSS variables for theming
- Class variance authority for variants
- Tailwind merge for className conflicts
- Semantic color naming
- Mobile-first responsive design
- Accessible focus states

## References

- Tailwind CSS Documentation: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Class Variance Authority: https://cva.style/docs
- tailwind-merge: https://github.com/dcastil/tailwind-merge

## Target Processes

- design-system-setup
- component-styling
- theming-dark-mode
- responsive-design
- accessibility-styling
