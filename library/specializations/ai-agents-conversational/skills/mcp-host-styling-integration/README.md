# MCP Host Styling Integration Skill

## Overview

The `mcp-host-styling-integration` skill integrates MCP App UIs with the host application's theming system. MCP Apps render in sandboxed iframes inside various hosts (Claude Desktop, ChatGPT, VS Code), each with its own visual theme. This skill ensures apps look native in every host while also working standalone.

## Key Features

- **Host CSS Variables**: Use `--color-*`, `--font-*`, `--border-radius-*` with fallback values
- **Dynamic Theme Changes**: Handle `onhostcontextchanged` for light/dark mode switches
- **SDK Helpers**: `applyDocumentTheme`, `applyHostStyleVariables`, `applyHostFonts`
- **React Hooks**: `useHostStyles`, `useHostStyleVariables`, `useHostFonts`
- **Safe Area Insets**: Handle mobile and embedded layout constraints
- **Hybrid Support**: CSS fallbacks ensure styling works in both MCP and standalone modes

## Prerequisites

1. **@modelcontextprotocol/ext-apps** installed
2. App instance created with PostMessageTransport
3. Understanding of CSS custom properties (variables)

## Quick Start

### CSS with Fallbacks

```css
body {
  background-color: var(--color-background-primary, #ffffff);
  color: var(--color-text-primary, #1a1a1a);
  font-family: var(--font-sans, system-ui, sans-serif);
}
```

### Vanilla JS Handler

```typescript
app.onhostcontextchanged = (params) => {
  applyDocumentTheme(params.context.theme);
  applyHostStyleVariables(params.context);
  applyHostFonts(params.context);
};
```

### React Hook

```tsx
useHostStyles(); // That's it -- handles everything
```

## Core Principle

Always use `var(--host-variable, fallback-value)` so the app looks correct in both modes:
- **MCP mode**: Host injects CSS variables, overriding fallbacks
- **Standalone mode**: Fallback values apply, app still looks good

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Phase 5: Client UI implementation |
| add-app-to-mcp-server.js | Phase 5: UI implementation |
| convert-web-app-to-mcp.js | Phase 6: Host styling integration |

## References

- [MCP Apps SDK - Styles](https://github.com/modelcontextprotocol/ext-apps/blob/main/src/styles.ts)
- [MCP Apps SDK - React Hooks](https://github.com/modelcontextprotocol/ext-apps/blob/main/src/react/useHostStyles.ts)

## Related Resources

- mcp-tool-resource-pattern - Server-side pattern this skill complements
- mcp-app-verification - Verify styling is applied correctly
