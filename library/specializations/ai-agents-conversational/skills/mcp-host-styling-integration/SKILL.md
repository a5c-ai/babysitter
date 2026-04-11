---
name: mcp-host-styling-integration
description: Integrates MCP App UI with host theming system. Applies host CSS variables, handles onhostcontextchanged, safe area insets, display mode detection, and fullscreen configuration.
allowed-tools: Read, Write, Edit
---

# mcp-host-styling-integration

Integrate MCP App UIs with the host application's theming system so apps look native in Claude Desktop, ChatGPT, VS Code, Goose, Postman, and other MCP-enabled hosts.

## Overview

MCP Apps render in sandboxed iframes inside host applications. Each host has its own visual theme (colors, fonts, border radii, spacing). The MCP Apps SDK provides:
- **CSS variables** (`--color-*`, `--font-*`, `--border-radius-*`) injected by the host
- **SDK helpers** (`applyDocumentTheme`, `applyHostStyleVariables`, `applyHostFonts`) to apply them
- **React hooks** (`useHostStyles`, `useHostStyleVariables`, `useHostFonts`) for React apps
- **`onhostcontextchanged` event** fired when theme changes (e.g., dark mode toggle)

The key principle is: always use CSS variable fallbacks so the app looks correct both as an MCP App (host provides variables) and standalone (fallback values apply).

## Capabilities

### Host CSS Variable Integration
- Apply all host CSS variables with sensible fallback values
- Support color variables: `--color-background-primary`, `--color-background-secondary`, `--color-text-primary`, `--color-text-secondary`, `--color-border-primary`
- Support font variables: `--font-sans`, `--font-mono`, `--font-text-base-size`, `--font-text-sm-size`
- Support layout variables: `--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`

### onhostcontextchanged Handler
- Listen for theme changes from the host
- Reapply styling when theme changes (e.g., light to dark mode)
- Access host context: theme, display mode, safe area insets

### Safe Area Insets
- Apply safe area padding for mobile or embedded contexts
- Handle `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, etc.

### Display Mode Detection
- Detect embedded vs fullscreen mode
- Adapt layout based on available space
- Configure fullscreen mode via tool metadata

### SDK Helper Functions
- `applyDocumentTheme(theme)` -- sets document-level theme class
- `applyHostStyleVariables(context)` -- applies all CSS variables from host
- `applyHostFonts(context)` -- loads and applies host fonts

### React Hook Integration
- `useHostStyles()` -- combined hook applying theme, variables, and fonts
- `useHostStyleVariables()` -- CSS variables only
- `useHostFonts()` -- font loading only

## Usage

### Vanilla JS: Full Host Styling

```typescript
import {
  App,
  PostMessageTransport,
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from '@modelcontextprotocol/ext-apps';

const app = new App({ transport: new PostMessageTransport() });

// Register handler BEFORE connect()
app.onhostcontextchanged = (params) => {
  const ctx = params.context;

  // Apply theme (light/dark)
  if (ctx.theme) {
    applyDocumentTheme(ctx.theme);
  }

  // Apply CSS variables
  applyHostStyleVariables(ctx);

  // Load and apply fonts
  applyHostFonts(ctx);
};

// THEN connect
await app.connect();
```

### React: useHostStyles Hook

```tsx
import { useApp, useHostStyles } from '@modelcontextprotocol/ext-apps/react';

function MyApp() {
  const app = useApp();
  useHostStyles();  // Handles all theme/variable/font application

  return (
    <div className="app-container">
      <h1>My MCP App</h1>
    </div>
  );
}
```

### CSS with Fallback Values

```css
/* Always use fallbacks so app works standalone too */
.app-container {
  background-color: var(--color-background-primary, #ffffff);
  color: var(--color-text-primary, #1a1a1a);
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
  font-size: var(--font-text-base-size, 14px);
  border-radius: var(--border-radius-md, 8px);
}

.card {
  background-color: var(--color-background-secondary, #f5f5f5);
  border: 1px solid var(--color-border-primary, #e0e0e0);
  border-radius: var(--border-radius-sm, 4px);
  padding: 16px;
}

.label {
  color: var(--color-text-secondary, #666666);
  font-size: var(--font-text-sm-size, 12px);
}

.code {
  font-family: var(--font-mono, 'Courier New', monospace);
}

/* Safe area insets for mobile/embedded contexts */
.app-root {
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

### Available Host CSS Variables

| Variable | Category | Description |
|----------|----------|-------------|
| `--color-background-primary` | Color | Main background |
| `--color-background-secondary` | Color | Card/section background |
| `--color-background-tertiary` | Color | Nested/subtle background |
| `--color-text-primary` | Color | Main text |
| `--color-text-secondary` | Color | Secondary/muted text |
| `--color-text-tertiary` | Color | Subtle/hint text |
| `--color-border-primary` | Color | Main borders |
| `--color-border-secondary` | Color | Subtle borders |
| `--color-accent` | Color | Interactive elements |
| `--color-error` | Color | Error states |
| `--color-success` | Color | Success states |
| `--color-warning` | Color | Warning states |
| `--font-sans` | Font | Sans-serif font family |
| `--font-mono` | Font | Monospace font family |
| `--font-text-xs-size` | Font | Extra small text size |
| `--font-text-sm-size` | Font | Small text size |
| `--font-text-base-size` | Font | Base text size |
| `--font-text-lg-size` | Font | Large text size |
| `--font-text-xl-size` | Font | Extra large text size |
| `--border-radius-sm` | Layout | Small border radius |
| `--border-radius-md` | Layout | Medium border radius |
| `--border-radius-lg` | Layout | Large border radius |
| `--border-radius-full` | Layout | Full/pill border radius |

### Hybrid App Styling (MCP + Standalone)

```css
/* Works in BOTH modes because of fallback values */
body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background-primary, #ffffff);
  color: var(--color-text-primary, #1a1a1a);
  font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
}

/* When host provides variables, they override fallbacks automatically */
/* When running standalone, fallback values apply */
```

### Fullscreen Mode

```typescript
// Configure fullscreen in the tool registration
registerAppTool(server, {
  name: 'show_dashboard',
  resourceUri: 'app:///dashboard',
  // Request fullscreen display
  displayMode: 'fullscreen',
  async handler(args) { /* ... */ },
});
```

## Common Pitfalls

1. **Hardcoding colors/fonts**: Always use CSS variables with fallbacks. Never hardcode `#ffffff` or `Arial` without a variable.
2. **Forgetting fallbacks**: Without fallback values, standalone mode will have no styling.
3. **Not handling theme changes**: The host can switch themes at any time. Always implement `onhostcontextchanged`.
4. **Ignoring safe area insets**: On mobile or certain embedded contexts, content can be obscured without safe area padding.
5. **Applying styles after connect()**: Register `onhostcontextchanged` BEFORE `app.connect()`.

## Verification Checklist

- [ ] All colors use `var(--color-*, fallback)` pattern
- [ ] All fonts use `var(--font-*, fallback)` pattern
- [ ] `onhostcontextchanged` handler registered BEFORE `app.connect()`
- [ ] `applyDocumentTheme` / `applyHostStyleVariables` / `applyHostFonts` called in handler
- [ ] CSS fallback values are sensible defaults (not broken/empty)
- [ ] Safe area insets applied to root container
- [ ] App looks correct in both MCP mode (host variables) and standalone (fallbacks)
- [ ] Theme switch (light/dark) handled dynamically

## Task Definition

```javascript
const mcpHostStylingTask = defineTask({
  name: 'mcp-host-styling-integration',
  description: 'Integrate MCP App UI with host theming system',

  inputs: {
    framework: { type: 'string', required: true },
    hybrid: { type: 'boolean', default: false },
    fullscreen: { type: 'boolean', default: false }
  },

  outputs: {
    cssFileCreated: { type: 'boolean' },
    handlerRegistered: { type: 'boolean' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Integrate host styling (${inputs.framework})`,
      skill: {
        name: 'mcp-host-styling-integration',
        context: {
          framework: inputs.framework,
          hybrid: inputs.hybrid,
          fullscreen: inputs.fullscreen,
          instructions: [
            'Create CSS with host variable fallbacks',
            'Implement onhostcontextchanged handler',
            'Apply theme, style variables, and fonts via SDK helpers',
            'Add safe area inset padding',
            'Verify styling in both MCP and standalone modes'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Applicable Processes

- create-mcp-app.js
- add-app-to-mcp-server.js
- convert-web-app-to-mcp.js

## External Dependencies

- `@modelcontextprotocol/ext-apps` (applyDocumentTheme, applyHostStyleVariables, applyHostFonts)
- `@modelcontextprotocol/ext-apps/react` (useHostStyles, useHostStyleVariables, useHostFonts) -- React only

## References

- [MCP Apps SDK - Styles](https://github.com/modelcontextprotocol/ext-apps/blob/main/src/styles.ts)
- [MCP Apps SDK - React Hooks](https://github.com/modelcontextprotocol/ext-apps/blob/main/src/react/useHostStyles.ts)
- [MCP Apps Patterns](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md)

## Related Skills

- mcp-app-scaffolding
- mcp-tool-resource-pattern
- mcp-app-verification
- single-file-bundling

## Related Agents

- mcp-ui-developer
- mcp-app-architect
